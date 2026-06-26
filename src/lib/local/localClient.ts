/* eslint-disable @typescript-eslint/no-explicit-any */
// A tiny in-browser stand-in for the Supabase client, backed by localStorage.
// It implements only the surface the app uses: auth (password/session),
// a chainable query builder (select/insert/update + eq/in/or/order/single/
// maybeSingle + count), embedded to-one relations, and no-op realtime.
//
// Activated automatically when no real Supabase credentials are configured,
// so the whole app runs locally with zero backend setup.

import { buildFixtures, type LocalDb } from './fixtures'

type Row = Record<string, any>
const DB_KEY = 'sc_local_db'
const SESSION_KEY = 'sc_local_session'

const now = () => new Date().toISOString()
const uuid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Math.floor(performance.now() * 1000)}-${Math.round(performance.now())}`

function loadDb(): LocalDb {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) return JSON.parse(raw) as LocalDb
  } catch {
    /* ignore */
  }
  const seeded = buildFixtures()
  saveDb(seeded)
  return seeded
}
function saveDb(db: LocalDb) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    /* ignore */
  }
}

// ---------- filter helpers ----------

interface Filter {
  apply: (row: Row) => boolean
}

/** Split on commas that are not nested inside parentheses. */
function splitTopLevel(input: string): string[] {
  const out: string[] = []
  let depth = 0
  let current = ''
  for (const ch of input) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      out.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  if (current) out.push(current)
  return out
}

function coerce(value: string): any {
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null') return null
  return value
}

/** Parse a single `col.eq.value` condition into a predicate. */
function parseCondition(cond: string): (row: Row) => boolean {
  const [col, op, ...rest] = cond.split('.')
  const value = coerce(rest.join('.'))
  return (row) => {
    if (op === 'eq') return String(row[col]) === String(value)
    return true
  }
}

/** Parse a PostgREST `.or()` string: `and(a.eq.1,b.eq.2),and(...)`. */
function parseOr(orString: string): (row: Row) => boolean {
  const clauses = splitTopLevel(orString).map((clause) => {
    const m = clause.match(/^and\((.*)\)$/s)
    const inner = m ? m[1] : clause
    const conds = splitTopLevel(inner).map(parseCondition)
    return (row: Row) => conds.every((c) => c(row))
  })
  return (row) => clauses.some((c) => c(row))
}

// ---------- embedded relation parsing ----------

interface Embed {
  alias: string
  table: keyof LocalDb
}

/** Parse a select string into base flag + to-one embeds (alias:table(...)). */
function parseSelect(select: string): { embeds: Embed[] } {
  const embeds: Embed[] = []
  for (const token of splitTopLevel(select)) {
    const t = token.trim()
    if (t === '*' || !t.includes('(')) continue
    // forms: "profile:profiles!fk(*)" or "session:sessions(*)"
    const aliasPart = t.split('(')[0]
    const [aliasRaw, tableRaw] = aliasPart.includes(':')
      ? aliasPart.split(':')
      : [aliasPart, aliasPart]
    const alias = aliasRaw.trim()
    const table = tableRaw.split('!')[0].trim() as keyof LocalDb
    embeds.push({ alias, table })
  }
  return { embeds }
}

// ---------- query builder ----------

class QueryBuilder<T = any> implements PromiseLike<{ data: T; error: any; count?: number }> {
  private filters: Filter[] = []
  private orders: { col: string; ascending: boolean }[] = []
  private mode: 'select' | 'insert' | 'update' = 'select'
  private payload: Row | Row[] | null = null
  private wantSingle: false | 'single' | 'maybe' = false
  private headCount = false
  private embeds: Embed[] = []

  constructor(
    private db: LocalDb,
    private table: keyof LocalDb,
    private persist: () => void,
  ) {}

  select(select = '*', opts?: { count?: string; head?: boolean }) {
    if (this.mode === 'select') {
      this.embeds = parseSelect(select).embeds
      if (opts?.head) this.headCount = true
    }
    return this
  }
  insert(payload: Row | Row[]) {
    this.mode = 'insert'
    this.payload = payload
    return this
  }
  update(payload: Row) {
    this.mode = 'update'
    this.payload = payload
    return this
  }
  eq(col: string, value: any) {
    this.filters.push({ apply: (row) => String(row[col]) === String(value) })
    return this
  }
  in(col: string, values: any[]) {
    const set = new Set(values.map(String))
    this.filters.push({ apply: (row) => set.has(String(row[col])) })
    return this
  }
  or(orString: string) {
    const pred = parseOr(orString)
    this.filters.push({ apply: pred })
    return this
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orders.push({ col, ascending: opts?.ascending ?? true })
    return this
  }
  single() {
    this.wantSingle = 'single'
    return this
  }
  maybeSingle() {
    this.wantSingle = 'maybe'
    return this
  }

  private rows(): Row[] {
    return (this.db[this.table] as Row[]) ?? []
  }

  private matched(): Row[] {
    return this.rows().filter((row) => this.filters.every((f) => f.apply(row)))
  }

  private withEmbeds(rows: Row[]): Row[] {
    if (this.embeds.length === 0) return rows
    return rows.map((row) => {
      const out = { ...row }
      for (const embed of this.embeds) {
        const target = (this.db[embed.table] as Row[]) ?? []
        const fk = row[`${embed.alias}_id`]
        out[embed.alias] = target.find((r) => String(r.id) === String(fk)) ?? null
      }
      return out
    })
  }

  private sorted(rows: Row[]): Row[] {
    if (this.orders.length === 0) return rows
    const copy = [...rows]
    copy.sort((a, b) => {
      for (const { col, ascending } of this.orders) {
        const av = a[col]
        const bv = b[col]
        if (av === bv) continue
        const cmp = av < bv ? -1 : 1
        return ascending ? cmp : -cmp
      }
      return 0
    })
    return copy
  }

  private execute(): { data: any; error: any; count?: number } {
    try {
      if (this.mode === 'insert') {
        const items = Array.isArray(this.payload) ? this.payload : [this.payload!]
        const inserted = items.map((item) => this.applyDefaults({ ...item }))
        ;(this.db[this.table] as Row[]).push(...inserted)
        this.persist()
        const data = this.wantSingle ? inserted[0] : inserted
        return { data, error: null }
      }

      if (this.mode === 'update') {
        const targets = this.matched()
        for (const row of targets) Object.assign(row, this.payload)
        this.persist()
        const data = this.wantSingle ? targets[0] ?? null : targets
        return { data, error: null }
      }

      // select
      let result = this.matched()
      if (this.headCount) {
        return { data: null, error: null, count: result.length }
      }
      result = this.withEmbeds(this.sorted(result))
      if (this.wantSingle === 'single') {
        if (result.length === 0) return { data: null, error: { message: 'No rows' } }
        return { data: result[0], error: null }
      }
      if (this.wantSingle === 'maybe') {
        return { data: result[0] ?? null, error: null }
      }
      return { data: result, error: null, count: result.length }
    } catch (error) {
      return { data: null, error }
    }
  }

  private applyDefaults(item: Row): Row {
    if (item.id == null) item.id = uuid()
    const stamp =
      this.table === 'times'
        ? 'recorded_at'
        : this.table === 'bookings'
          ? 'requested_at'
          : 'created_at'
    if (item[stamp] == null) item[stamp] = now()
    return item
  }

  then<R1 = { data: T; error: any; count?: number }, R2 = never>(
    onfulfilled?: ((value: { data: T; error: any; count?: number }) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: any) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return Promise.resolve(this.execute() as any).then(onfulfilled, onrejected)
  }
}

// ---------- auth ----------

interface LocalSession {
  user: { id: string; email: string }
}

function createAuth(db: LocalDb, persist: () => void) {
  let listener: ((event: string, session: LocalSession | null) => void) | null = null

  const getStoredSession = (): LocalSession | null => {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      return raw ? (JSON.parse(raw) as LocalSession) : null
    } catch {
      return null
    }
  }
  const setStoredSession = (session: LocalSession | null) => {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(SESSION_KEY)
    listener?.(session ? 'SIGNED_IN' : 'SIGNED_OUT', session)
  }

  return {
    async getSession() {
      return { data: { session: getStoredSession() }, error: null }
    },
    onAuthStateChange(cb: (event: string, session: LocalSession | null) => void) {
      listener = cb
      return { data: { subscription: { unsubscribe() { listener = null } } } }
    },
    async signInWithPassword({ email }: { email: string; password: string }) {
      const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
      if (!user) return { data: { session: null }, error: { message: 'No account for that email. Try a demo account.' } }
      const session: LocalSession = { user: { id: user.id, email: user.email } }
      setStoredSession(session)
      return { data: { session }, error: null }
    },
    async signUp({ email, options }: { email: string; password: string; options?: { data?: { full_name?: string } } }) {
      let user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
      if (!user) {
        user = { id: uuid(), email }
        db.users.push(user)
        ;(db.profiles as Row[]).push({
          id: user.id,
          full_name: options?.data?.full_name ?? '',
          role: null,
          avatar_url: null,
          level: null,
          coach_id: null,
          created_at: now(),
        })
        persist()
      }
      const session: LocalSession = { user: { id: user.id, email: user.email } }
      setStoredSession(session)
      return { data: { session }, error: null }
    },
    async signOut() {
      setStoredSession(null)
      return { error: null }
    },
  }
}

// ---------- the client ----------

export function createLocalClient() {
  const db = loadDb()
  const persist = () => saveDb(db)

  return {
    auth: createAuth(db, persist),
    from(table: string) {
      return new QueryBuilder(db, table as keyof LocalDb, persist)
    },
    channel() {
      const ch: any = { on: () => ch, subscribe: () => ch }
      return ch
    },
    removeChannel() {
      return Promise.resolve('ok')
    },
  }
}

export const isLocalBackend = true

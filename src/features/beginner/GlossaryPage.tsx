import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { glossary } from './content'

export function GlossaryPage() {
  const [query, setQuery] = useState('')

  const grouped = useMemo(() => {
    const filtered = glossary.filter(
      (t) =>
        t.term.toLowerCase().includes(query.toLowerCase()) ||
        t.definition.toLowerCase().includes(query.toLowerCase()),
    )
    const map = new Map<string, typeof glossary>()
    for (const t of filtered.sort((a, b) => a.term.localeCompare(b.term))) {
      const letter = t.term[0].toUpperCase()
      if (!map.has(letter)) map.set(letter, [])
      map.get(letter)!.push(t)
    }
    return map
  }, [query])

  return (
    <div className="space-y-5">
      <SectionHeader kicker="Glossary" />
      <div className="relative max-w-md">
        <Input placeholder="Search terms…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
      </div>

      {grouped.size === 0 ? (
        <EmptyState icon={<Search className="h-6 w-6" />} title="No terms found" description="Try a different search." />
      ) : (
        <div className="space-y-5">
          {[...grouped.entries()].map(([letter, terms]) => (
            <Card key={letter}>
              <h3 className="mb-3 text-lg font-semibold text-coral">{letter}</h3>
              <dl className="space-y-3">
                {terms.map((t) => (
                  <div key={t.term}>
                    <dt className="font-medium text-text-primary">{t.term}</dt>
                    <dd className="text-sm text-text-secondary">{t.definition}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

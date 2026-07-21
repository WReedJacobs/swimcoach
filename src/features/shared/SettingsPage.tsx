import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, Lock, LogOut, RefreshCw, Moon, Sun, Monitor, Download, Trash2, AtSign, Activity, Unlink } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Modal } from '@/components/ui/Modal'
import { supabase, isLocalMode } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useSwimmers } from '@/hooks/useSwimmers'
import { useTheme, type Theme } from '@/hooks/useTheme'
import { useStravaConnection, useSyncStrava, useDisconnectStrava, startStravaConnect } from '@/hooks/useStrava'
import { useNutritionProfile } from '@/hooks/useNutritionProfile'
import { NutritionProfileSetup } from './NutritionProfileSetup'
import { useSubscription } from '@/hooks/useSubscription'
import { useCancelSubscription } from '@/hooks/useCheckout'
import { cn } from '@/lib/cn'

/** Plan status + self-serve cancellation (via Paystack's subscription API —
 * no hosted portal to redirect to). Upgrading itself happens on UpgradePage;
 * this is only for existing subscribers to cancel. */
function BillingCard() {
  const { profile } = useAuth()
  const { data: subscription } = useSubscription()
  const cancel = useCancelSubscription()
  const [error, setError] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const navigate = useNavigate()

  const doCancel = async () => {
    setError(null)
    try {
      await cancel.mutateAsync()
      setConfirmCancel(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not cancel subscription')
    }
  }

  const isSubscribed = subscription && subscription.status !== 'canceled'

  return (
    <Card>
      <CardHeader
        title="Billing"
        subtitle={isSubscribed ? `${subscription.plan} · ${subscription.status}` : 'Free plan'}
      />
      {error && <p className="mb-2 text-sm text-danger">{error}</p>}
      {isSubscribed ? (
        <Button variant="secondary" onClick={() => setConfirmCancel(true)}>
          Cancel subscription
        </Button>
      ) : (
        <Button onClick={() => navigate(profile?.role === 'coach' ? '/coach/upgrade' : '/swimmer/upgrade')}>
          Upgrade
        </Button>
      )}
      <Modal open={confirmCancel} onClose={() => setConfirmCancel(false)} title="Cancel subscription?">
        <p className="text-sm text-text-secondary">
          You'll keep access until the end of your current billing period, then drop to the free plan.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmCancel(false)}>Keep subscription</Button>
          <Button variant="danger" loading={cancel.isPending} onClick={doCancel}>Cancel subscription</Button>
        </div>
      </Modal>
    </Card>
  )
}

/** Edit entry for the nutrition profile (training + preference inputs only —
 * see NutritionProfileSetup). Setup itself happens inline on the Nutrition
 * pages; this is just the "editable in settings" access point from the spec. */
function NutritionSettingsCard() {
  const { data: profile } = useNutritionProfile()
  const [open, setOpen] = useState(false)

  return (
    <Card>
      <CardHeader
        title="Nutrition profile"
        subtitle={profile ? 'Set up — training and preference inputs only.' : 'Not set up yet.'}
      />
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {profile ? 'Edit nutrition profile' : 'Set up nutrition profile'}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nutrition profile">
        <NutritionProfileSetup initial={profile} onSaved={() => setOpen(false)} />
      </Modal>
    </Card>
  )
}

/** Connect/sync/disconnect card for Strava — auto-imports pool swims as
 * logged times. Hidden in local mode: there's no backend to hold tokens. */
function StravaCard() {
  const { data: connection } = useStravaConnection()
  const sync = useSyncStrava()
  const disconnect = useDisconnectStrava()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  if (isLocalMode) return null

  const handleSync = async () => {
    setMsg(null)
    try {
      const res = await sync.mutateAsync()
      setMsg({ ok: true, text: `Imported ${res.imported} new swim${res.imported === 1 ? '' : 's'}` })
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Sync failed' })
    }
  }

  return (
    <Card>
      <CardHeader
        title="Strava"
        subtitle={
          connection
            ? `Connected · last synced ${connection.last_synced_at ? new Date(connection.last_synced_at).toLocaleString() : 'never'}`
            : 'Auto-import your pool swims as logged times.'
        }
      />
      {msg && (
        <p className={`mb-3 text-sm ${msg.ok ? 'text-secondary' : 'text-danger'}`}>{msg.text}</p>
      )}
      {connection ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            loading={sync.isPending}
            onClick={handleSync}
          >
            Sync now
          </Button>
          <Button
            variant="outline"
            leftIcon={<Unlink className="h-4 w-4" />}
            loading={disconnect.isPending}
            onClick={() => disconnect.mutate()}
          >
            Disconnect
          </Button>
        </div>
      ) : (
        <Button leftIcon={<Activity className="h-4 w-4" />} onClick={() => startStravaConnect()}>
          Connect Strava
        </Button>
      )}
    </Card>
  )
}

const THEME_OPTIONS: Array<{ value: Theme; label: string; icon: typeof Moon }> = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
]

export function SettingsPage() {
  const { profile, user, signOut, refreshProfile } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  // Profile
  const [name, setName] = useState(profile?.full_name ?? '')
  const [handle, setHandle] = useState(profile?.display_handle ?? '')
  const storedAvatar = profile?.avatar_url ?? ''
  const [avatarUrl, setAvatarUrl] = useState(
    storedAvatar.startsWith('http') ? storedAvatar : '',
  )
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Password
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Role-switch guardrail
  const { data: swimmers } = useSwimmers()
  const [showRoleWarn, setShowRoleWarn] = useState(false)

  // Account deletion
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deletePhrase, setDeletePhrase] = useState('')
  const [deleting, setDeleting] = useState(false)

  const saveProfile = async () => {
    if (!user) return
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: name.trim(),
          avatar_url: avatarUrl.trim() || null,
          display_handle: handle.trim() || null,
        })
        .eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      setProfileMsg({ ok: true, text: 'Saved' })
    } catch (e) {
      setProfileMsg({ ok: false, text: e instanceof Error ? e.message : 'Save failed' })
    } finally {
      setProfileSaving(false)
    }
  }

  const savePassword = async () => {
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: 'Passwords do not match' })
      return
    }
    if (newPw.length < 6) {
      setPwMsg({ ok: false, text: 'Must be at least 6 characters' })
      return
    }
    setPwSaving(true)
    setPwMsg(null)
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: currentPw,
      })
      if (signInErr) throw new Error('Current password is incorrect')
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) throw error
      setPwMsg({ ok: true, text: 'Password updated' })
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
    } catch (e) {
      setPwMsg({ ok: false, text: e instanceof Error ? e.message : 'Update failed' })
    } finally {
      setPwSaving(false)
    }
  }

  const handleRoleChange = () => {
    if (profile?.role === 'coach' && swimmers && swimmers.length > 0) {
      setShowRoleWarn(true)
    } else {
      navigate('/role-select')
    }
  }

  const exportData = async () => {
    if (!user) return
    const profileRes = await supabase.from('profiles').select('*').eq('id', user.id).single()

    let timesData: unknown[] = []
    let goalsData: unknown[] = []

    if (profile?.role === 'swimmer') {
      const { data: sw } = await supabase
        .from('swimmers')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle()
      if (sw) {
        const [t, g] = await Promise.all([
          supabase.from('times').select('*').eq('swimmer_id', sw.id),
          supabase.from('goals').select('*').eq('swimmer_id', sw.id),
        ])
        timesData = t.data ?? []
        goalsData = g.data ?? []
      }
    } else {
      const [t, g] = await Promise.all([
        supabase.from('times').select('*').eq('coach_id', user.id),
        supabase.from('feedback').select('*').eq('coach_id', user.id),
      ])
      timesData = t.data ?? []
      goalsData = g.data ?? []
    }

    const payload = {
      exported_at: new Date().toISOString(),
      profile: profileRes.data,
      times: timesData,
      data: goalsData,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `swimphoria-data-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const deleteAccount = async () => {
    if (!user) return
    setDeleting(true)
    try {
      if (profile?.role === 'swimmer') {
        // swimmers.id cascades to times/goals/feedback/bookings/session_assignments/
        // css_results (all FK'd ON DELETE CASCADE to swimmers) — deleting this one
        // row cleans up everything else, no per-table deletes needed.
        await supabase.from('swimmers').delete().eq('profile_id', user.id)
      } else {
        // Coach — delete owned data. Deleting the squad's `swimmers` rows cascades
        // their times/goals/feedback/bookings/session_assignments/css_results too
        // (same cascade the schema already declares for a deleted coach profile).
        await Promise.all([
          supabase.from('times').delete().eq('coach_id', user.id),
          supabase.from('sessions').delete().eq('coach_id', user.id),
          supabase.from('feedback').delete().eq('coach_id', user.id),
          supabase.from('bookings').delete().eq('coach_id', user.id),
          supabase.from('swimmers').delete().eq('coach_id', user.id),
        ])
      }
      await Promise.all([
        supabase.from('messages').delete().eq('sender_id', user.id),
        supabase.from('messages').delete().eq('recipient_id', user.id),
        // profile_id-scoped regardless of role, and not covered by the
        // swimmers/coach cascades above.
        supabase.from('nutrition_profiles').delete().eq('profile_id', user.id),
        supabase.from('hydration_logs').delete().eq('profile_id', user.id),
        supabase.from('strava_connections').delete().eq('profile_id', user.id),
      ])
      // Clear PII from profile; full auth deletion requires a server-side admin call
      await supabase.from('profiles').update({
        full_name: '[deleted]',
        avatar_url: null,
        display_handle: null,
      }).eq('id', user.id)
      await signOut()
      navigate('/')
    } catch (e) {
      setDeleting(false)
      alert(e instanceof Error ? e.message : 'Deletion failed')
    }
  }

  return (
    <div className="max-w-xl space-y-8">
      {/* Profile */}
      <div>
        <SectionHeader kicker="Profile" />
        <Card>
          <CardHeader title="Your profile" subtitle={`${profile?.role ?? ''} · ${user?.email ?? ''}`} />
          <div className="mb-5 flex items-center gap-4">
            <Avatar name={name || 'You'} url={avatarUrl || null} size="lg" />
            <p className="text-xs text-text-muted">Update your name or paste an image URL below</p>
          </div>
          <div className="space-y-4">
            <Input
              label="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="relative">
              <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                label="Public handle"
                placeholder="yourhandle"
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                hint="Shown in leaderboard instead of your full name. Letters, numbers, _ and - only."
                className="pl-9"
              />
            </div>
            <Input
              label="Avatar URL"
              type="url"
              placeholder="https://..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              hint="Paste any publicly accessible image URL"
            />
            {profileMsg && (
              <p className={`text-sm ${profileMsg.ok ? 'text-secondary' : 'text-danger'}`}>
                {profileMsg.text}
              </p>
            )}
            <Button
              leftIcon={<Save className="h-4 w-4" />}
              loading={profileSaving}
              onClick={saveProfile}
              disabled={!name.trim()}
            >
              Save profile
            </Button>
          </div>
        </Card>
      </div>

      {/* Connected apps */}
      {!isLocalMode && (
        <div>
          <SectionHeader kicker="Connected apps" />
          <StravaCard />
        </div>
      )}

      {/* Nutrition */}
      {!isLocalMode && (
        <div>
          <SectionHeader kicker="Nutrition" />
          <NutritionSettingsCard />
        </div>
      )}

      {/* Billing */}
      {!isLocalMode && (
        <div>
          <SectionHeader kicker="Billing" />
          <BillingCard />
        </div>
      )}

      {/* Security */}
      <div>
        <SectionHeader kicker="Security" />
        <Card>
          <CardHeader title="Change password" />
          <div className="space-y-4">
            <Input
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
            />
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              error={confirmPw && newPw !== confirmPw ? 'Passwords do not match' : undefined}
            />
            {pwMsg && (
              <p className={`text-sm ${pwMsg.ok ? 'text-secondary' : 'text-danger'}`}>
                {pwMsg.text}
              </p>
            )}
            <Button
              leftIcon={<Lock className="h-4 w-4" />}
              loading={pwSaving}
              onClick={savePassword}
              disabled={!currentPw || !newPw || newPw !== confirmPw}
            >
              Update password
            </Button>
          </div>
        </Card>
      </div>

      {/* Appearance */}
      <div>
        <SectionHeader kicker="Appearance" />
        <Card>
          <CardHeader title="Theme" subtitle="Choose your preferred colour scheme." />
          <div className="flex gap-2">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                aria-label={`${label} theme`}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1.5 rounded-component border px-3 py-3 text-xs font-medium transition-colors',
                  theme === value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-surface text-text-secondary hover:border-primary/40 hover:text-text-primary',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Account */}
      <div>
        <SectionHeader kicker="Account" />
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Switch role"
              subtitle={`Currently signed in as ${profile?.role ?? 'beginner'}. Change to swimmer or coach.`}
            />
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={handleRoleChange}
            >
              Change my role
            </Button>
          </Card>

          <Card>
            <CardHeader
              title="Export my data"
              subtitle="Download a JSON file with all your Swimphoria data."
            />
            <Button
              variant="outline"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={exportData}
            >
              Export data
            </Button>
          </Card>

          <Card>
            <CardHeader title="Sign out" subtitle="You'll be returned to the home page." />
            <Button
              variant="danger"
              leftIcon={<LogOut className="h-4 w-4" />}
              onClick={async () => {
                await signOut()
                navigate('/')
              }}
            >
              Sign out
            </Button>
          </Card>

          <Card>
            <CardHeader
              title="Delete account"
              subtitle="Permanently removes your data. This cannot be undone."
            />
            <Button
              variant="danger"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={() => setDeleteConfirm(true)}
            >
              Delete my account
            </Button>
          </Card>
        </div>
      </div>

      {/* Role-switch guardrail modal */}
      <Modal open={showRoleWarn} onClose={() => setShowRoleWarn(false)} title="Switch role?">
        <p className="text-sm text-text-secondary">
          You have <span className="font-semibold text-text-primary">{swimmers?.length ?? 0} swimmer{(swimmers?.length ?? 0) !== 1 ? 's' : ''}</span> in your roster. Switching roles will not delete your roster data, but you will lose coach access until you switch back.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setShowRoleWarn(false)}>Cancel</Button>
          <Button
            variant="secondary"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={() => { setShowRoleWarn(false); navigate('/role-select') }}
          >
            Switch anyway
          </Button>
        </div>
      </Modal>

      {/* Delete account modal */}
      <Modal open={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="Delete your account?">
        <p className="text-sm text-text-secondary">
          This will permanently remove your profile and data. Type <span className="font-mono font-semibold text-danger">delete</span> to confirm.
        </p>
        <Input
          className="mt-3"
          placeholder="delete"
          value={deletePhrase}
          onChange={(e) => setDeletePhrase(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => { setDeleteConfirm(false); setDeletePhrase('') }}>Cancel</Button>
          <Button
            variant="danger"
            leftIcon={<Trash2 className="h-4 w-4" />}
            loading={deleting}
            disabled={deletePhrase !== 'delete'}
            onClick={deleteAccount}
          >
            Delete permanently
          </Button>
        </div>
      </Modal>
    </div>
  )
}

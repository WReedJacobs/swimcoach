import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, Lock, LogOut, RefreshCw } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export function SettingsPage() {
  const { profile, user, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState(profile?.full_name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const saveProfile = async () => {
    if (!user) return
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: name.trim(), avatar_url: avatarUrl.trim() || null })
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

  return (
    <div className="max-w-xl space-y-8">
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
              onClick={() => navigate('/role-select')}
            >
              Change my role
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
        </div>
      </div>
    </div>
  )
}

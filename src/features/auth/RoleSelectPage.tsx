import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Waves, Sparkles } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { cn } from '@/lib/cn'
import { useAuth } from '@/hooks/useAuth'
import type { Role, Level } from '@/types'

const options: { role: Role; title: string; desc: string; icon: typeof Waves }[] = [
  { role: 'coach', title: "I'm a coach", desc: 'Manage swimmers, log times, build sessions.', icon: ClipboardList },
  { role: 'swimmer', title: "I'm a swimmer", desc: 'Follow your coach, track times and goals.', icon: Waves },
  { role: 'beginner', title: "I'm just starting", desc: 'Self-guided guides, glossary and milestones.', icon: Sparkles },
]

export function RoleSelectPage() {
  const { setRole } = useAuth()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Role | null>(null)
  const [level, setLevel] = useState<Level>('beginner')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!selected) return
    setSaving(true)
    setError(null)
    try {
      await setRole(selected, selected === 'swimmer' ? level : undefined)
      navigate(`/${selected}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your role. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthLayout title="How will you use Swimphoria?" subtitle="You can change this later.">
      <div className="space-y-3">
        {options.map((opt) => (
          <button
            key={opt.role}
            type="button"
            onClick={() => setSelected(opt.role)}
            className={cn(
              'flex w-full items-center gap-4 rounded-card border p-4 text-left transition-colors',
              selected === opt.role
                ? 'border-primary bg-primary/5'
                : 'border-border hover:bg-bg',
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-component bg-primary/10 text-primary">
              <opt.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-text-primary">{opt.title}</p>
              <p className="text-sm text-text-secondary">{opt.desc}</p>
            </div>
          </button>
        ))}

        {selected === 'swimmer' && (
          <Select
            label="Your level"
            value={level}
            onChange={(e) => setLevel(e.target.value as Level)}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="elite">Elite</option>
          </Select>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button className="w-full" disabled={!selected} loading={saving} onClick={submit}>
          Continue
        </Button>
      </div>
    </AuthLayout>
  )
}

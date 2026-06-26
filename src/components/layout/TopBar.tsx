import { useNavigate } from 'react-router-dom'
import { LogOut, LogIn } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export function TopBar({ title }: { title: string }) {
  const { profile, isAuthenticated, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-border bg-bg/80 px-6 backdrop-blur-md">
      <h1 className="text-lg font-semibold tracking-tight text-text-primary">{title}</h1>

      <div className="flex items-center gap-3">
        {isAuthenticated && profile ? (
          <>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-text-primary">{profile.full_name || 'You'}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">{profile.role}</p>
            </div>
            <Avatar name={profile.full_name || 'You'} url={profile.avatar_url} />
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<LogOut className="h-4 w-4" />}
              onClick={async () => {
                await signOut()
                navigate('/login')
              }}
            >
              Sign out
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<LogIn className="h-4 w-4" />}
            onClick={() => navigate('/login')}
          >
            Sign in
          </Button>
        )}
      </div>
    </header>
  )
}

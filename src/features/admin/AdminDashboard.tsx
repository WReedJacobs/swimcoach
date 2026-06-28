import { useMemo } from 'react'
import { Shield } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatTile } from '@/components/ui/StatTile'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { SkeletonCards } from '@/components/ui/Skeleton'
import { useAllProfiles, useSetAdmin } from '@/hooks/useAdmin'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/types'

const roleTone: Record<Role, 'blue' | 'green' | 'coral'> = {
  coach: 'blue',
  swimmer: 'green',
  beginner: 'coral',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function AdminDashboard() {
  const { profile: me } = useAuth()
  const { data: profiles, isLoading, error } = useAllProfiles()
  const setAdmin = useSetAdmin()

  const stats = useMemo(
    () => ({
      total: profiles?.length ?? 0,
      coaches: profiles?.filter((p) => p.role === 'coach').length ?? 0,
      swimmers: profiles?.filter((p) => p.role === 'swimmer').length ?? 0,
      beginners: profiles?.filter((p) => p.role === 'beginner').length ?? 0,
      admins: profiles?.filter((p) => p.is_admin).length ?? 0,
    }),
    [profiles],
  )

  return (
    <div className="space-y-8">
      <SectionHeader kicker="Admin" />

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Total users" value={stats.total} />
        <StatTile label="Coaches" value={stats.coaches} />
        <StatTile label="Swimmers" value={stats.swimmers} />
        <StatTile label="Beginners" value={stats.beginners} />
        <StatTile label="Admins" value={stats.admins} accent />
      </div>

      <Card>
        <CardHeader title="All users" subtitle={`${stats.total} registered`} />

        {error && (
          <p className="py-4 text-sm text-danger">
            Failed to load users — ensure the admin RLS policies are applied.
          </p>
        )}

        {isLoading ? (
          <SkeletonCards />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 pr-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                    User
                  </th>
                  <th className="pb-3 pr-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                    Role
                  </th>
                  <th className="hidden pb-3 pr-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted sm:table-cell">
                    Joined
                  </th>
                  <th className="pb-3 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                    Admin
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(profiles ?? []).map((p) => {
                  const isSelf = p.id === me?.id
                  return (
                    <tr key={p.id}>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={p.full_name} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-text-primary">
                              {p.full_name}
                            </p>
                            {isSelf && (
                              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-muted">
                                you
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge tone={roleTone[p.role] ?? 'gray'} className="capitalize">
                          {p.role}
                        </Badge>
                      </td>
                      <td className="hidden py-3 pr-4 font-mono text-xs tabular-nums text-text-muted sm:table-cell">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() =>
                            setAdmin.mutate({ id: p.id, isAdmin: !p.is_admin })
                          }
                          disabled={isSelf || setAdmin.isPending}
                          title={isSelf ? "Can't change your own admin status" : undefined}
                          className={`inline-flex items-center gap-1.5 rounded-component px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                            p.is_admin
                              ? 'bg-danger/10 text-danger hover:bg-danger/20'
                              : 'bg-border text-text-muted hover:bg-primary/10 hover:text-primary'
                          }`}
                        >
                          <Shield className="h-3 w-3" />
                          {p.is_admin ? 'Admin' : 'User'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ListChecks } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Card, CardBody, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { KpiCard, KpiGrid, PageHeader } from '@/components/shared'
import { useAsync } from '@/hooks'
import { useAuthStore } from '@/store/authStore'
import { roleById } from '@/config/roles'
import { getRoleDashboard } from '../dashboardData'
import { QuickLinks } from '../components/QuickLinks'

const TONE_BORDERS = {
  danger: 'border-l-danger',
  warning: 'border-l-warning',
  info: 'border-l-info',
  primary: 'border-l-primary',
  success: 'border-l-success',
}

/** Every non-CXO role's home: their KPIs and their needs-attention queue. */
export function RoleDashboard() {
  const user = useAuthStore((state) => state.user)
  const role = useAuthStore((state) => state.impersonatedRole ?? state.role)

  const load = useCallback(() => getRoleDashboard(role), [role])
  const { data, loading } = useAsync(load, [role])

  const roleMeta = roleById[role]
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={`Good to see you, ${firstName}`}
        description={roleMeta?.description ?? 'Your work across the order book.'}
      />

      <KpiGrid className="mb-5">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <KpiCard key={index} label="" value="" loading />
            ))
          : (data?.kpis ?? []).map((kpi) => (
              <KpiCard
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                hint={kpi.hint}
                tone={kpi.tone}
              />
            ))}
      </KpiGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {loading ? (
              <div className="flex flex-col gap-2 p-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : (data?.tasks ?? []).length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <CheckCircle2 className="size-6 text-success" aria-hidden="true" />
                <p className="text-sm font-medium text-text">Nothing needs you right now</p>
                <p className="max-w-sm text-sm text-muted">
                  Delays, pending approvals and overdue items will appear here as they come up.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {(data?.tasks ?? []).map((task) => (
                  <li key={task.id}>
                    <Link
                      to={task.to}
                      className={cn(
                        'flex items-center justify-between gap-3 border-l-2 px-4 py-3 transition-colors',
                        'hover:bg-surface-2/60',
                        TONE_BORDERS[task.tone] ?? 'border-l-border',
                      )}
                    >
                      <span className="flex min-w-0 flex-col leading-tight">
                        <span className="text-sm font-medium text-text">{task.title}</span>
                        <span className="truncate text-xs text-muted">{task.detail}</span>
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-muted" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <div className="flex flex-col gap-4">
          <QuickLinks role={role} />

          <Card>
            <CardHeader>
              <CardTitle>Your role</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-sm font-medium text-text">{roleMeta?.label ?? role}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{roleMeta?.description}</p>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
                <ListChecks className="size-3.5" aria-hidden="true" />
                Use the role switcher in the topbar to see the app as another role.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

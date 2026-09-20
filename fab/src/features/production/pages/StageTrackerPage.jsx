import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Factory, Gauge, Pencil } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Badge, Button, Card, EmptyState, Progress, SkeletonCards } from '@/components/ui'
import { FilterBar, KpiCard, KpiGrid, PageHeader, StatusBadge } from '@/components/shared'
import { useAsync } from '@/hooks'
import { useCan } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { getStageTracker, updateStageOutput } from '@/services/productionService'
import { PRODUCTION_STAGES } from '@/config/statuses'
import { table } from '@/mocks/db'
import { formatDate, formatNumber, formatPercent } from '@/utils/format'
import { UpdateOutputDrawer } from '../components/UpdateOutputDrawer'

/** Production → Stage tracker: per-stage progress for every order on the floor. */
export function StageTrackerPage() {
  const can = useCan()
  const canEdit = can('production', 'edit')
  const [filters, setFilters] = useState({})
  const [editingStage, setEditingStage] = useState(null)

  const load = useCallback(() => getStageTracker(), [])
  const { data, loading, error, reload } = useAsync(load)
  const groups = useMemo(() => data ?? [], [data])

  const vendorsById = useMemo(
    () => Object.fromEntries(table('vendors').map((vendor) => [vendor.id, vendor])),
    [],
  )

  const stats = useMemo(() => {
    const totalPlanned = groups.reduce(
      (sum, group) => sum + group.stages.reduce((inner, stage) => inner + stage.quantityPlanned, 0),
      0,
    )
    const totalDone = groups.reduce(
      (sum, group) => sum + group.stages.reduce((inner, stage) => inner + stage.quantityDone, 0),
      0,
    )
    return {
      orders: groups.length,
      delayed: groups.filter((group) => group.delayedStages > 0).length,
      completion: totalPlanned > 0 ? (totalDone / totalPlanned) * 100 : 0,
      units: groups.reduce((sum, group) => sum + group.quantity, 0),
    }
  }, [groups])

  const save = async (stageId, update) => {
    await updateStageOutput(stageId, update)
    toast.success('Output recorded', `${formatNumber(update.quantityDone)} pcs`)
    reload()
  }

  const filterConfig = [
    {
      key: 'vendorId',
      label: 'Factory',
      width: 'w-56',
      options: [...new Set(groups.map((group) => group.vendorId))]
        .filter(Boolean)
        .map((id) => ({ value: id, label: vendorsById[id]?.name ?? id })),
    },
    {
      key: 'delayed',
      label: 'Delay',
      width: 'w-44',
      options: [
        { value: 'yes', label: 'Has a delayed stage' },
        { value: 'no', label: 'On plan' },
      ],
    },
  ]

  const filtered = groups.filter((group) => {
    if (filters.vendorId && group.vendorId !== filters.vendorId) return false
    if (filters.delayed === 'yes' && group.delayedStages === 0) return false
    if (filters.delayed === 'no' && group.delayedStages > 0) return false
    return true
  })

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Stage tracker"
        description="Where every live order stands, stage by stage, across the allocated units."
        breadcrumbs={[{ label: 'Production' }, { label: 'Stage tracker' }]}
      />

      <KpiGrid className="mb-5">
        <KpiCard label="Orders in production" value={stats.orders} icon={Factory} tone="primary" loading={loading} />
        <KpiCard label="Units in progress" value={formatNumber(stats.units)} tone="info" loading={loading} />
        <KpiCard
          label="Overall completion"
          value={formatPercent(stats.completion, 0)}
          icon={Gauge}
          tone={stats.completion >= 70 ? 'success' : 'warning'}
          loading={loading}
        />
        <KpiCard
          label="Orders with a delay"
          value={stats.delayed}
          icon={AlertTriangle}
          tone="danger"
          loading={loading}
          onClick={() => setFilters({ delayed: 'yes' })}
        />
      </KpiGrid>

      <FilterBar filters={filterConfig} values={filters} onChange={setFilters} className="mb-4" />

      {loading ? (
        <SkeletonCards count={3} className="grid-cols-1 sm:grid-cols-1 xl:grid-cols-1" />
      ) : error ? (
        <Card>
          <EmptyState
            icon={AlertTriangle}
            title="Couldn’t load the tracker"
            description={error.message}
            action={<Button onClick={reload}>Try again</Button>}
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            title="No orders match these filters"
            description="Production tracking starts once fabric is in-house."
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((group) => (
            <Card key={group.orderId}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/app/orders/${group.orderId}`}
                      className="text-sm font-semibold text-text hover:text-primary hover:underline"
                    >
                      {group.poNumber}
                    </Link>
                    <span className="text-sm text-muted">· {group.clientName}</span>
                    {group.delayedStages > 0 && (
                      <Badge tone="danger" size="sm" dot>
                        {group.delayedStages} stage{group.delayedStages === 1 ? '' : 's'} delayed
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {group.styleName} · {formatNumber(group.quantity)} pcs ·{' '}
                    {vendorsById[group.vendorId]?.name ?? 'Unallocated'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">Overall</span>
                  <Progress
                    value={group.completionPercent}
                    className="w-28"
                    tone={group.delayedStages > 0 ? 'danger' : group.completionPercent >= 99 ? 'success' : 'primary'}
                  />
                  <span className="w-10 text-right text-sm font-semibold tabular-nums text-text">
                    {group.completionPercent.toFixed(0)}%
                  </span>
                </div>
              </div>

              <ul className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
                {group.stages.map((stage) => {
                  const meta = PRODUCTION_STAGES[stage.stage]
                  const percent =
                    stage.quantityPlanned > 0 ? (stage.quantityDone / stage.quantityPlanned) * 100 : 0
                  const Icon = meta?.icon ?? Factory
                  return (
                    <li
                      key={stage.id}
                      className={cn(
                        'bg-surface p-3',
                        stage.status === 'DELAYED' && 'bg-danger-soft/25',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2">
                          <Icon className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
                          <span className="truncate text-xs font-medium text-text">
                            {meta?.short ?? stage.stage}
                          </span>
                        </span>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Update ${meta?.label ?? stage.stage} for ${group.poNumber}`}
                            onClick={() => setEditingStage(stage)}
                          >
                            <Pencil className="size-3" />
                          </Button>
                        )}
                      </div>

                      <Progress
                        className="mt-2"
                        size="sm"
                        value={percent}
                        tone={
                          stage.status === 'COMPLETED'
                            ? 'success'
                            : stage.status === 'DELAYED'
                              ? 'danger'
                              : 'primary'
                        }
                      />
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="text-[11px] tabular-nums text-muted">
                          {formatNumber(stage.quantityDone)} / {formatNumber(stage.quantityPlanned)}
                        </span>
                        <StatusBadge kind="stageStatus" value={stage.status} size="sm" dot={false} />
                      </div>
                      <p className="mt-1 text-[10px] text-muted">
                        {formatDate(stage.plannedStart, 'dd MMM')} –{' '}
                        {formatDate(stage.plannedEnd, 'dd MMM')}
                        {stage.delayDays > 0 && (
                          <span className="ml-1 font-medium text-danger">+{stage.delayDays}d</span>
                        )}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </Card>
          ))}
        </div>
      )}

      <UpdateOutputDrawer
        stage={editingStage}
        onClose={() => setEditingStage(null)}
        onSave={save}
      />
    </div>
  )
}

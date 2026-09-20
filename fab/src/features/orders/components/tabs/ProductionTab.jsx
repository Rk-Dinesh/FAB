import { Factory } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Progress } from '@/components/ui'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PRODUCTION_STAGES } from '@/config/statuses'
import { formatDate, formatNumber } from '@/utils/format'
import { Field, Panel, TabEmpty } from './TabShell'

/** Order 360 → Production: a progress bar per stage, with delays highlighted. */
export function ProductionTab({ order }) {
  const stages = order.productionStages ?? []
  const allocation = (order.allocations ?? [])[0]

  if (stages.length === 0) {
    return (
      <Panel title="Production" padded>
        <TabEmpty
          icon={Factory}
          title="Production hasn’t started"
          description="Stage tracking begins once fabric is in-house at the allocated unit."
        />
      </Panel>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {allocation && (
        <Panel title="Factory allocation">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <Field label="Unit" value={order.factory?.name} hint={order.factory?.city} />
            <Field label="Lines" value={allocation.lineCount} />
            <Field label="Daily capacity" value={`${formatNumber(allocation.dailyCapacity)} pcs`} />
            <Field label="Planned window" value={`${formatDate(allocation.plannedStart, 'dd MMM')} – ${formatDate(allocation.plannedEnd, 'dd MMM')}`} />
            <Field label="Status" value={<StatusBadge kind="stageStatus" value={allocation.status === 'RUNNING' ? 'IN_PROGRESS' : allocation.status === 'COMPLETED' ? 'COMPLETED' : 'NOT_STARTED'} size="sm" />} />
          </dl>
          {allocation.notes && <p className="mt-3 text-xs text-muted">{allocation.notes}</p>}
        </Panel>
      )}

      <Panel title="Stage progress" description="Planned dates against actual output, stage by stage.">
        <ol className="flex flex-col gap-4">
          {stages.map((stage) => {
            const meta = PRODUCTION_STAGES[stage.stage]
            const percent =
              stage.quantityPlanned > 0 ? (stage.quantityDone / stage.quantityPlanned) * 100 : 0
            const Icon = meta?.icon ?? Factory
            const late = stage.status === 'DELAYED'

            return (
              <li
                key={stage.id}
                className={cn(
                  'rounded-lg border p-3.5',
                  late ? 'border-danger/30 bg-danger-soft/25' : 'border-border',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg',
                        stage.status === 'COMPLETED'
                          ? 'bg-success-soft text-success'
                          : late
                            ? 'bg-danger-soft text-danger'
                            : stage.status === 'IN_PROGRESS'
                              ? 'bg-primary-soft text-primary'
                              : 'bg-surface-2 text-muted',
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text">{meta?.label ?? stage.stage}</p>
                      <p className="text-xs text-muted">
                        Planned {formatDate(stage.plannedStart, 'dd MMM')} –{' '}
                        {formatDate(stage.plannedEnd, 'dd MMM')}
                        {stage.actualStart && (
                          <>
                            {' · actual '}
                            {formatDate(stage.actualStart, 'dd MMM')}
                            {stage.actualEnd ? ` – ${formatDate(stage.actualEnd, 'dd MMM')}` : ' – ongoing'}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {late && (
                      <span className="text-xs font-semibold text-danger">
                        {stage.delayDays}d behind
                      </span>
                    )}
                    <StatusBadge kind="stageStatus" value={stage.status} size="sm" />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <Progress
                    value={percent}
                    tone={
                      stage.status === 'COMPLETED' ? 'success' : late ? 'danger' : 'primary'
                    }
                    className="flex-1"
                  />
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {formatNumber(stage.quantityDone)} / {formatNumber(stage.quantityPlanned)} pcs
                  </span>
                </div>

                {stage.remarks && <p className="mt-2 text-xs text-muted">{stage.remarks}</p>}
              </li>
            )
          })}
        </ol>
      </Panel>
    </div>
  )
}

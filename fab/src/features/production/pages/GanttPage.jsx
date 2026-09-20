import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarRange } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Badge, Button, Card, CardBody, EmptyState, Skeleton, Tooltip } from '@/components/ui'
import { FilterBar, PageHeader } from '@/components/shared'
import { useAsync } from '@/hooks'
import { getStageTracker } from '@/services/productionService'
import { PRODUCTION_STAGES } from '@/config/statuses'
import { table } from '@/mocks/db'
import { formatDate, formatNumber } from '@/utils/format'

const DAY_MS = 86400000
const STAGE_TONES = {
  FABRIC_INHOUSE: 'bg-info',
  CUTTING: 'bg-info',
  STITCHING: 'bg-primary',
  WASHING_EMB: 'bg-primary',
  FINISHING: 'bg-warning',
  PACKING: 'bg-warning',
  FINAL_INSPECTION: 'bg-success',
}

// Read once at module load so render stays pure.
const TODAY_MS = new Date(new Date().toISOString().slice(0, 10)).getTime()

/** @param {string} isoDay */
const toMs = (isoDay) => new Date(`${isoDay}T00:00:00.000Z`).getTime()

/** Production → Gantt: every order's stage plan on one timeline. */
export function GanttPage() {
  const [filters, setFilters] = useState({})

  const load = useCallback(() => getStageTracker(), [])
  const { data, loading, error, reload } = useAsync(load)
  const groups = useMemo(() => data ?? [], [data])

  const vendorsById = useMemo(
    () => Object.fromEntries(table('vendors').map((vendor) => [vendor.id, vendor])),
    [],
  )

  const filtered = useMemo(
    () =>
      groups.filter((group) => {
        if (filters.vendorId && group.vendorId !== filters.vendorId) return false
        if (filters.delayed === 'yes' && group.delayedStages === 0) return false
        return true
      }),
    [groups, filters],
  )

  /** The timeline window is the span of every stage on screen, padded a little. */
  const timeline = useMemo(() => {
    const dates = filtered.flatMap((group) =>
      group.stages.flatMap((stage) => [toMs(stage.plannedStart), toMs(stage.plannedEnd)]),
    )
    if (dates.length === 0) return null
    const start = Math.min(...dates) - 3 * DAY_MS
    const end = Math.max(...dates) + 3 * DAY_MS
    const span = Math.max(1, end - start)

    // One tick per week, labelled with the week-start date.
    const ticks = []
    for (let cursor = start; cursor <= end; cursor += 7 * DAY_MS) {
      ticks.push({ at: cursor, percent: ((cursor - start) / span) * 100 })
    }
    return {
      start,
      end,
      span,
      ticks,
      todayPercent: TODAY_MS >= start && TODAY_MS <= end ? ((TODAY_MS - start) / span) * 100 : null,
    }
  }, [filtered])

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
      options: [{ value: 'yes', label: 'Delayed only' }],
    },
  ]

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Production timeline"
        description="Every live order's stage plan on one timeline, with today marked."
        breadcrumbs={[{ label: 'Production' }, { label: 'Gantt' }]}
      />

      <FilterBar filters={filterConfig} values={filters} onChange={setFilters} className="mb-4" />

      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="flex flex-col gap-3 p-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <EmptyState
              title="Couldn’t load the timeline"
              description={error.message}
              action={
                <Button variant="secondary" onClick={reload}>
                  Try again
                </Button>
              }
            />
          ) : !timeline || filtered.length === 0 ? (
            <EmptyState
              icon={CalendarRange}
              title="Nothing scheduled"
              description="The timeline fills once orders are allocated and stages are planned."
            />
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[56rem]">
                {/* week ruler */}
                <div className="sticky top-0 z-10 flex border-b border-border bg-surface-2/60">
                  <div className="w-56 shrink-0 border-r border-border px-3 py-2 text-xs font-semibold text-muted">
                    Order
                  </div>
                  <div className="relative flex-1 py-2">
                    {timeline.ticks.map((tick) => (
                      <span
                        key={tick.at}
                        className="absolute top-2 -translate-x-1/2 text-[10px] tabular-nums text-muted"
                        style={{ left: `${tick.percent}%` }}
                      >
                        {formatDate(new Date(tick.at).toISOString(), 'dd MMM')}
                      </span>
                    ))}
                  </div>
                </div>

                <ul>
                  {filtered.map((group) => (
                    <li key={group.orderId} className="flex border-b border-border last:border-0">
                      <div className="w-56 shrink-0 border-r border-border px-3 py-2.5">
                        <Link
                          to={`/app/orders/${group.orderId}`}
                          className="block truncate text-sm font-medium text-text hover:text-primary hover:underline"
                        >
                          {group.poNumber}
                        </Link>
                        <p className="truncate text-[11px] text-muted">
                          {group.clientName} · {formatNumber(group.quantity)} pcs
                        </p>
                        {group.delayedStages > 0 && (
                          <Badge tone="danger" size="sm" className="mt-1">
                            {group.delayedStages} delayed
                          </Badge>
                        )}
                      </div>

                      <div className="relative flex-1 py-3">
                        {/* week gridlines */}
                        {timeline.ticks.map((tick) => (
                          <span
                            key={tick.at}
                            className="absolute inset-y-0 w-px bg-border/60"
                            style={{ left: `${tick.percent}%` }}
                            aria-hidden="true"
                          />
                        ))}

                        {timeline.todayPercent !== null && (
                          <span
                            className="absolute inset-y-0 z-10 w-0.5 bg-danger"
                            style={{ left: `${timeline.todayPercent}%` }}
                            aria-label="Today"
                          />
                        )}

                        <div className="relative h-5">
                          {group.stages.map((stage) => {
                            const start = toMs(stage.plannedStart)
                            const end = toMs(stage.plannedEnd)
                            const left = ((start - timeline.start) / timeline.span) * 100
                            const width = Math.max(
                              0.6,
                              ((end - start) / timeline.span) * 100,
                            )
                            const meta = PRODUCTION_STAGES[stage.stage]
                            return (
                              <Tooltip
                                key={stage.id}
                                content={
                                  <span className="block">
                                    <span className="font-medium">{meta?.label}</span>
                                    <br />
                                    {formatDate(stage.plannedStart)} – {formatDate(stage.plannedEnd)}
                                    <br />
                                    {formatNumber(stage.quantityDone)} / {formatNumber(stage.quantityPlanned)} pcs
                                    {stage.delayDays > 0 && ` · ${stage.delayDays} days late`}
                                  </span>
                                }
                              >
                                <span
                                  className={cn(
                                    'absolute top-0 h-5 rounded-sm opacity-90 transition-opacity hover:opacity-100',
                                    stage.status === 'DELAYED'
                                      ? 'bg-danger'
                                      : stage.status === 'COMPLETED'
                                        ? 'bg-success'
                                        : (STAGE_TONES[stage.stage] ?? 'bg-primary'),
                                  )}
                                  style={{ left: `${left}%`, width: `${width}%` }}
                                />
                              </Tooltip>
                            )
                          })}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-4 rounded-sm bg-primary" aria-hidden="true" /> On plan
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-4 rounded-sm bg-success" aria-hidden="true" /> Completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-4 rounded-sm bg-danger" aria-hidden="true" /> Delayed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-0.5 bg-danger" aria-hidden="true" /> Today
        </span>
      </div>
    </div>
  )
}

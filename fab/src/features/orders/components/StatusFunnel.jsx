import { cn } from '@/utils/cn'
import { Skeleton } from '@/components/ui/Skeleton'
import { ORDER_STATUSES, ORDER_STATUS_FLOW } from '@/config/statuses'
import { formatCurrency } from '@/utils/format'

const BAR_TONES = {
  default: 'bg-muted/40',
  info: 'bg-info',
  primary: 'bg-primary',
  warning: 'bg-warning',
  success: 'bg-success',
  danger: 'bg-danger',
}

/**
 * Horizontal lifecycle funnel across the order book. Clicking a step filters
 * the list below it.
 *
 * @param {{orders: Array<object>, loading?: boolean, activeStatus?: string,
 *   onSelect?: (status: string) => void, className?: string}} props
 */
export function StatusFunnel({ orders, loading = false, activeStatus, onSelect, className }) {
  const counts = ORDER_STATUS_FLOW.map((status) => {
    const matching = orders.filter((order) => order.status === status)
    return {
      status,
      label: ORDER_STATUSES[status].label,
      tone: ORDER_STATUSES[status].tone,
      count: matching.length,
      value: matching.reduce((sum, order) => sum + order.orderValue, 0),
    }
  })
  const max = Math.max(1, ...counts.map((entry) => entry.count))

  if (loading) {
    return (
      <div className={cn('rounded-lg border border-border bg-surface p-4', className)}>
        <Skeleton className="h-4 w-40" />
        <div className="mt-4 flex gap-2">
          {ORDER_STATUS_FLOW.map((status) => (
            <Skeleton key={status} className="h-20 flex-1" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <section className={cn('rounded-lg border border-border bg-surface p-4', className)}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-text">Orders by lifecycle stage</h2>
        <p className="text-xs text-muted">
          {activeStatus ? 'Click the highlighted stage to clear the filter' : 'Click a stage to filter'}
        </p>
      </div>

      <ol className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {counts.map((entry) => {
          const active = entry.status === activeStatus
          return (
            <li key={entry.status} className="min-w-16 flex-1">
              <button
                type="button"
                onClick={() => onSelect?.(entry.status)}
                aria-pressed={active}
                className={cn(
                  'flex h-full w-full flex-col items-center justify-end gap-1.5 rounded-md p-1.5 transition-colors',
                  active ? 'bg-primary-soft' : 'hover:bg-surface-2',
                )}
              >
                <span className="text-sm font-semibold tabular-nums text-text">{entry.count}</span>
                <span
                  className={cn('w-full rounded-sm transition-all', BAR_TONES[entry.tone] ?? BAR_TONES.default)}
                  style={{ height: `${Math.max(4, (entry.count / max) * 44)}px` }}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    'line-clamp-2 min-h-7 text-center text-[10px] leading-tight',
                    active ? 'font-medium text-primary' : 'text-muted',
                  )}
                >
                  {entry.label}
                </span>
                <span className="text-[10px] tabular-nums text-muted">
                  {entry.value > 0 ? formatCurrency(entry.value, 'USD', { compact: true }) : '—'}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

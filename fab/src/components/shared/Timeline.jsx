import { Circle } from 'lucide-react'
import { cn } from '@/utils/cn'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, formatRelative } from '@/utils/format'

const TONES = {
  default: 'border-border bg-surface text-muted',
  primary: 'border-primary bg-primary-soft text-primary',
  success: 'border-success bg-success-soft text-success',
  warning: 'border-warning bg-warning-soft text-warning',
  danger: 'border-danger bg-danger-soft text-danger',
  info: 'border-info bg-info-soft text-info',
}

/**
 * Vertical event list — the activity log, the order timeline and the shipment
 * tracking view all render through this.
 *
 * @param {{items: Array<{id: string, title: string, description?: string,
 *   at?: string, tone?: keyof typeof TONES, icon?: import('react').ElementType,
 *   meta?: import('react').ReactNode, done?: boolean}>,
 *   emptyTitle?: string, emptyDescription?: string, relative?: boolean,
 *   className?: string}} props
 */
export function Timeline({
  items = [],
  emptyTitle = 'Nothing recorded yet',
  emptyDescription,
  relative = true,
  className,
}) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} compact />
  }

  return (
    <ol className={cn('relative flex flex-col', className)}>
      {items.map((item, index) => {
        const Icon = item.icon ?? Circle
        const last = index === items.length - 1
        const tone = item.tone ?? 'default'

        return (
          <li key={item.id ?? index} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && (
              <span
                aria-hidden="true"
                className="absolute left-[11px] top-7 h-[calc(100%-1.5rem)] w-px bg-border"
              />
            )}
            <span
              className={cn(
                'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border',
                TONES[tone],
                item.done === false && 'opacity-50',
              )}
            >
              <Icon className="size-3" aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="text-sm font-medium text-text">{item.title}</p>
                {item.at && (
                  <time
                    dateTime={item.at}
                    className="shrink-0 text-xs text-muted"
                    title={formatDate(item.at, 'dd MMM yyyy, HH:mm')}
                  >
                    {relative ? formatRelative(item.at) : formatDate(item.at)}
                  </time>
                )}
              </div>
              {item.description && (
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{item.description}</p>
              )}
              {item.meta && <div className="mt-1.5">{item.meta}</div>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

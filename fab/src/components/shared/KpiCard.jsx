import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Skeleton } from '@/components/ui/Skeleton'

const TONES = {
  default: 'bg-surface-2 text-muted',
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
}

/**
 * Headline number tile used on every dashboard and module landing page.
 *
 * @param {{label: string, value: import('react').ReactNode, hint?: string,
 *   icon?: import('react').ElementType, tone?: keyof typeof TONES,
 *   delta?: number, deltaLabel?: string, deltaGoodWhen?: 'up'|'down',
 *   loading?: boolean, onClick?: () => void, className?: string,
 *   children?: import('react').ReactNode}} props
 */
export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
  delta,
  deltaLabel,
  deltaGoodWhen = 'up',
  loading = false,
  onClick,
  className,
  children,
}) {
  const Wrapper = onClick ? 'button' : 'div'
  const hasDelta = delta !== undefined && delta !== null && Number.isFinite(delta)
  const rising = hasDelta && delta >= 0
  const good = hasDelta && (deltaGoodWhen === 'up' ? rising : !rising)
  const DeltaIcon = rising ? TrendingUp : TrendingDown

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex w-full flex-col rounded-lg border border-border bg-surface p-4 text-left',
        onClick && 'transition-colors hover:border-border-strong hover:bg-surface-2/40',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-muted">{label}</p>
        {Icon && (
          <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg', TONES[tone])}>
            <Icon className="size-4" aria-hidden="true" />
          </span>
        )}
      </div>

      {loading ? (
        <Skeleton className="mt-2.5 h-7 w-28" />
      ) : (
        <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums text-text">
          {value}
        </p>
      )}

      {(hint || hasDelta) && (
        <div className="mt-1.5 flex items-center gap-2 text-xs">
          {hasDelta && (
            <span className={cn('inline-flex items-center gap-1 font-medium', good ? 'text-success' : 'text-danger')}>
              <DeltaIcon className="size-3.5" aria-hidden="true" />
              {Math.abs(delta).toFixed(1)}%
              {deltaLabel && <span className="font-normal text-muted">{deltaLabel}</span>}
            </span>
          )}
          {hint && <span className="text-muted">{hint}</span>}
        </div>
      )}

      {children && <div className="mt-3">{children}</div>}
    </Wrapper>
  )
}

/** Responsive row of KPI tiles. */
export function KpiGrid({ columns = 4, className, children }) {
  return (
    <div
      className={cn(
        'grid gap-4',
        columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 xl:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  )
}

import { cn } from '@/utils/cn'

const TONES = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
}

const SIZES = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' }

/**
 * @param {{value?: number, max?: number, tone?: keyof typeof TONES,
 *   size?: 'sm'|'md'|'lg', showValue?: boolean, label?: string,
 *   className?: string}} props
 */
export function Progress({
  value = 0,
  max = 100,
  tone = 'primary',
  size = 'md',
  showValue = false,
  label,
  className,
}) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
          {label && <span className="text-muted">{label}</span>}
          {showValue && (
            <span className="font-medium tabular-nums text-text">{Math.round(percent)}%</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className={cn('w-full overflow-hidden rounded-full bg-surface-2', SIZES[size])}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-500', TONES[tone])}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

/** Compact circular variant for KPI tiles. */
export function ProgressRing({ value = 0, size = 44, stroke = 4, tone = 'primary', label }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const percent = Math.min(100, Math.max(0, value))
  const offset = circumference - (percent / 100) * circumference
  const colors = {
    primary: 'var(--primary)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    danger: 'var(--danger)',
    info: 'var(--info)',
  }

  return (
    <span className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute text-[11px] font-semibold tabular-nums text-text">
        {label ?? `${Math.round(percent)}%`}
      </span>
    </span>
  )
}

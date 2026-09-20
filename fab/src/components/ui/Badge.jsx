import { cn } from '@/utils/cn'

const TONES = {
  default: 'bg-surface-2 text-muted border-border',
  primary: 'bg-primary-soft text-primary border-primary/25',
  success: 'bg-success-soft text-success border-success/25',
  warning: 'bg-warning-soft text-warning border-warning/25',
  danger: 'bg-danger-soft text-danger border-danger/25',
  info: 'bg-info-soft text-info border-info/25',
  outline: 'bg-transparent text-text border-border-strong',
}

const SIZES = {
  sm: 'h-5 px-1.5 text-[11px] gap-1',
  md: 'h-6 px-2 text-xs gap-1.5',
}

/**
 * @param {{tone?: keyof typeof TONES, size?: 'sm'|'md', dot?: boolean,
 *   icon?: import('react').ReactNode, className?: string,
 *   children?: import('react').ReactNode}} props
 */
export function Badge({ tone = 'default', size = 'md', dot = false, icon, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium whitespace-nowrap',
        TONES[tone] ?? TONES.default,
        SIZES[size],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {icon}
      {children}
    </span>
  )
}

import { Inbox } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * @param {{icon?: import('react').ElementType, title: string, description?: string,
 *   action?: import('react').ReactNode, className?: string, compact?: boolean}} props
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  compact = false,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'px-4 py-8' : 'px-6 py-14',
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-surface-2">
        <Icon className="size-5 text-muted" aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-semibold text-text">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

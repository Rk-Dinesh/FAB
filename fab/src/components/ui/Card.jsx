import { cn } from '@/utils/cn'

/**
 * @param {{className?: string, padded?: boolean, hoverable?: boolean,
 *   children?: import('react').ReactNode}} props
 */
export function Card({ className, padded = false, hoverable = false, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-surface',
        padded && 'p-4',
        hoverable && 'transition-colors hover:border-border-strong',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, actions, ...props }) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 border-b border-border px-4 py-3',
        className,
      )}
      {...props}
    >
      <div className="min-w-0">{children}</div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

/**
 * A card heading. Cards sit directly beneath the page's `<h1>`, so this is an
 * `<h2>` by default; pass `as` when a card is nested under another heading.
 */
export function CardTitle({ as: Component = 'h2', className, children, ...props }) {
  return (
    <Component className={cn('text-sm font-semibold text-text', className)} {...props}>
      {children}
    </Component>
  )
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn('mt-0.5 text-xs text-muted', className)} {...props}>
      {children}
    </p>
  )
}

export function CardBody({ className, children, ...props }) {
  return (
    <div className={cn('p-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 border-t border-border bg-surface-2/40 px-4 py-3',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

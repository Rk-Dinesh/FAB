import { cn } from '@/utils/cn'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * Titled panel used by every Order 360 tab, so the tabs stay visually uniform.
 * @param {{title: string, description?: string, actions?: import('react').ReactNode,
 *   padded?: boolean, className?: string, children: import('react').ReactNode}} props
 */
export function Panel({ title, description, actions, padded = true, className, children }) {
  return (
    <section className={cn('overflow-hidden rounded-lg border border-border bg-surface', className)}>
      <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-text">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      <div className={padded ? 'p-4' : undefined}>{children}</div>
    </section>
  )
}

/** Label / value pair used throughout the tabs. */
export function Field({ label, value, hint, tone, className }) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd
        className={cn(
          'mt-0.5 text-sm text-text',
          tone === 'danger' && 'font-medium text-danger',
          tone === 'success' && 'font-medium text-success',
        )}
      >
        {value ?? '—'}
      </dd>
      {hint && <p className="mt-0.5 text-[11px] text-muted">{hint}</p>}
    </div>
  )
}

/** Consistent "this tab has nothing yet" state. */
export function TabEmpty({ title, description, icon }) {
  return <EmptyState icon={icon} title={title} description={description} compact />
}

/** Simple striped table for the tab panels. */
export function MiniTable({ head, children, className }) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse text-sm">
        <thead className="bg-surface-2/50">
          <tr>
            {head.map((cell) => (
              <th
                key={typeof cell === 'string' ? cell : cell.label}
                scope="col"
                className={cn(
                  'border-b border-border px-3 py-2 text-left text-xs font-semibold text-muted',
                  typeof cell === 'object' && cell.align === 'right' && 'text-right',
                )}
              >
                {typeof cell === 'string' ? cell : cell.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

import { cn } from '@/utils/cn'
import { Breadcrumbs } from './Breadcrumbs'

/**
 * Standard page title block: breadcrumbs, title, description, primary actions.
 * @param {{title: string, description?: string,
 *   breadcrumbs?: Array<{label: string, to?: string}>,
 *   actions?: import('react').ReactNode, className?: string,
 *   children?: import('react').ReactNode}} props
 */
export function PageHeader({ title, description, breadcrumbs, actions, className, children }) {
  return (
    <div className={cn('mb-5', className)}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-2" />}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-text">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}

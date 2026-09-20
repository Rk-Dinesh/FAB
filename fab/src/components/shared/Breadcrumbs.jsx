import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * @param {{items: Array<{label: string, to?: string}>, className?: string}} props
 */
export function Breadcrumbs({ items = [], className }) {
  if (items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-xs', className)}>
      {items.map((item, index) => {
        const last = index === items.length - 1
        return (
          <Fragment key={`${item.label}-${index}`}>
            {item.to && !last ? (
              <Link to={item.to} className="text-muted transition-colors hover:text-text">
                {item.label}
              </Link>
            ) : (
              <span className={last ? 'font-medium text-text' : 'text-muted'}>{item.label}</span>
            )}
            {!last && (
              <ChevronRight className="size-3 shrink-0 text-muted" aria-hidden="true" />
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}

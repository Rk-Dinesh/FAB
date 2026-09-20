import { cn } from '@/utils/cn'

/** @param {{className?: string}} props */
export function Skeleton({ className, ...props }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-surface-2', className)}
      {...props}
    />
  )
}

/** Table-shaped placeholder used while a DataTable loads. */
export function SkeletonTable({ rows = 6, columns = 5 }) {
  return (
    <div className="w-full" role="status" aria-label="Loading data">
      <div className="flex gap-4 border-b border-border px-4 py-3">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-3.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 border-b border-border px-4 py-3.5">
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <Skeleton
              key={columnIndex}
              className={cn('h-3.5 flex-1', columnIndex === 0 && 'max-w-[140px]')}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Card-grid placeholder used on dashboards. */
export function SkeletonCards({ count = 4, className }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-lg border border-border bg-surface p-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-7 w-32" />
          <Skeleton className="mt-3 h-3 w-20" />
        </div>
      ))}
    </div>
  )
}

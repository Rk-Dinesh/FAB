import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

/** @param {{className?: string, label?: string}} props */
export function Spinner({ className, label = 'Loading' }) {
  return (
    <span role="status" aria-label={label} className="inline-flex">
      <Loader2 className={cn('size-4 animate-spin text-muted', className)} aria-hidden="true" />
    </span>
  )
}

/** Full-area loading state for route-level suspense. */
export function PageSpinner({ label = 'Loading' }) {
  return (
    <div className="flex min-h-64 w-full flex-1 items-center justify-center gap-3 text-sm text-muted">
      <Spinner className="size-5" label={label} />
      {label}…
    </div>
  )
}

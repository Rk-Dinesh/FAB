import { cn } from '@/utils/cn'

/** Titled block used to group the kit demos. */
export function KitSection({ title, description, className, children }) {
  return (
    <section className="rounded-lg border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-text">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      <div className={cn('flex flex-wrap items-start gap-4 p-4', className)}>{children}</div>
    </section>
  )
}

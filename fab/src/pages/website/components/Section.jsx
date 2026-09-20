import { cn } from '@/utils/cn'

/** Standard marketing section wrapper — consistent gutters and rhythm. */
export function Section({ className, children, muted = false, ...props }) {
  return (
    <section className={cn(muted && 'bg-surface-2/40', className)} {...props}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">{children}</div>
    </section>
  )
}

/** Eyebrow + heading + lead paragraph. */
export function SectionHeading({ eyebrow, title, lead, align = 'left', className }) {
  return (
    <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && <p className="text-sm font-semibold text-primary">{eyebrow}</p>}
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-text sm:text-4xl">{title}</h2>
      {lead && <p className="mt-4 text-base leading-relaxed text-muted">{lead}</p>}
    </div>
  )
}

/** A feature / capability tile. */
export function FeatureCard({ icon: Icon, title, children, className }) {
  return (
    <div className={cn('rounded-lg border border-border bg-surface p-5', className)}>
      {Icon && (
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary-soft">
          <Icon className="size-4.5 text-primary" aria-hidden="true" />
        </span>
      )}
      <h3 className="mt-3.5 text-sm font-semibold text-text">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{children}</p>
    </div>
  )
}

/** A big number with a caption. */
export function Stat({ value, label, className }) {
  return (
    <div className={className}>
      <p className="text-3xl font-semibold tracking-tight text-text">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  )
}

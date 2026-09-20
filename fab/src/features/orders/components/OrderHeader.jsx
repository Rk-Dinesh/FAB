import { Link } from 'react-router-dom'
import { AlertTriangle, CalendarClock, Factory, Package, User } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Badge } from '@/components/ui'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Stepper } from '@/components/ui/Stepper'
import { orderLifecycleSteps } from '@/config/statuses'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'

/**
 * The fixed header of the Order 360 screen: identity, headline numbers, risk
 * and the lifecycle stepper.
 *
 * @param {{order: object}} props
 */
export function OrderHeader({ order }) {
  const steps = orderLifecycleSteps(order)
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.value === order.status),
  )
  const delayed = order.delayDays > 0

  return (
    <section className="rounded-lg border border-border bg-surface">
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-text">{order.poNumber}</h1>
              <StatusBadge value={order.status} withIcon />
              <StatusBadge kind="risk" value={order.risk} />
              {delayed && (
                <Badge tone="danger" icon={<AlertTriangle className="size-3" />}>
                  {order.delayDays} days behind
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted">
              <Link to="/app/crm/clients" className="font-medium text-text hover:underline">
                {order.clientName}
              </Link>{' '}
              · {order.styleName} ({order.styleNumber}) · {order.season} · client PO{' '}
              {order.clientPoNumber}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
          <Figure
            icon={Package}
            label="Quantity"
            value={`${formatNumber(order.quantity)} pcs`}
            hint={`${order.colorIds.length} colours`}
          />
          <Figure
            icon={null}
            label="FOB price"
            value={formatCurrency(order.fobPrice, 'USD', { decimals: 2 })}
            hint={order.incoterm}
          />
          <Figure
            icon={null}
            label="Order value"
            value={formatCurrency(order.orderValue, 'USD', { compact: true })}
            hint={order.paymentTermCode}
          />
          <Figure
            icon={CalendarClock}
            label="Ex-factory"
            value={formatDate(order.revisedExFactoryDate ?? order.exFactoryDate)}
            hint={
              order.revisedExFactoryDate ? `was ${formatDate(order.exFactoryDate)}` : 'on the original plan'
            }
            tone={delayed ? 'danger' : undefined}
          />
          <Figure
            icon={Factory}
            label="Factory"
            value={order.factory?.name ?? 'Not allocated'}
            hint={order.factory?.city}
          />
          <Figure
            icon={User}
            label="Merchandiser"
            value={order.merchandiser?.name ?? '—'}
            hint={order.merchandiser?.title}
          />
        </dl>
      </div>

      <div className="border-t border-border px-4 py-4 sm:px-5">
        <Stepper steps={steps} current={currentIndex} />
      </div>
    </section>
  )
}

function Figure({ icon: Icon, label, value, hint, tone }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs text-muted">
        {Icon && <Icon className="size-3.5" aria-hidden="true" />}
        {label}
      </dt>
      <dd
        className={cn(
          'mt-0.5 truncate text-sm font-semibold text-text',
          tone === 'danger' && 'text-danger',
        )}
        title={String(value)}
      >
        {value}
      </dd>
      {hint && <p className="truncate text-[11px] text-muted">{hint}</p>}
    </div>
  )
}

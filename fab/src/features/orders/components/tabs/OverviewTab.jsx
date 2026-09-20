import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { Badge, Progress } from '@/components/ui'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'
import { Field, Panel } from './TabShell'

/** Order 360 → Overview: commercial terms, progress and what needs attention. */
export function OverviewTab({ order }) {
  const stages = order.productionStages ?? []
  const producedTotal = stages.reduce((sum, stage) => sum + stage.quantityDone, 0)
  const plannedTotal = stages.reduce((sum, stage) => sum + stage.quantityPlanned, 0)
  const completion = plannedTotal > 0 ? (producedTotal / plannedTotal) * 100 : 0

  const lateMilestones = (order.milestones ?? []).filter((milestone) => milestone.status === 'LATE')
  const pendingSamples = (order.samples ?? []).filter((sample) => sample.status === 'PENDING')
  const openDefects = (order.defects ?? []).filter((defect) => defect.status === 'OPEN')
  const unpaid = (order.invoices ?? []).reduce((sum, invoice) => sum + invoice.balance, 0)

  const attention = [
    lateMilestones.length > 0 && {
      tone: 'danger',
      icon: AlertTriangle,
      text: `${lateMilestones.length} T&A milestone${lateMilestones.length === 1 ? '' : 's'} missed — latest is "${lateMilestones[lateMilestones.length - 1].name}".`,
    },
    pendingSamples.length > 0 && {
      tone: 'warning',
      icon: Clock,
      text: `${pendingSamples.length} sample${pendingSamples.length === 1 ? '' : 's'} still awaiting a decision from ${order.clientName}.`,
    },
    openDefects.length > 0 && {
      tone: 'warning',
      icon: AlertTriangle,
      text: `${openDefects.length} defect${openDefects.length === 1 ? '' : 's'} open against this order.`,
    },
    unpaid > 0 && {
      tone: 'info',
      icon: Clock,
      text: `${formatCurrency(unpaid, 'USD')} still outstanding across ${order.invoices.length} invoice${order.invoices.length === 1 ? '' : 's'}.`,
    },
  ].filter(Boolean)

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel title="Commercial" className="lg:col-span-2">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
          <Field label="Client" value={order.client?.name} hint={order.client?.country} />
          <Field label="Client PO" value={order.clientPoNumber} />
          <Field label="Style" value={order.styleName} hint={order.styleNumber} />
          <Field label="Category" value={order.category?.name} />
          <Field label="Fabric" value={order.fabric?.name} hint={order.fabric?.composition} />
          <Field label="Size set" value={order.sizeSet?.name} hint={order.sizeSet?.sizes.join(' / ')} />
          <Field label="Quantity" value={`${formatNumber(order.quantity)} pcs`} />
          <Field label="FOB price" value={formatCurrency(order.fobPrice, 'USD', { decimals: 2 })} />
          <Field label="Order value" value={formatCurrency(order.orderValue, 'USD')} />
          <Field label="Incoterm" value={order.incoterm} />
          <Field label="Payment terms" value={order.paymentTermCode} />
          <Field label="Destination" value={order.destinationPort?.name} hint={order.destinationPort?.country} />
          <Field label="Enquiry received" value={formatDate(order.enquiryDate)} />
          <Field label="PO confirmed" value={order.confirmedDate ? formatDate(order.confirmedDate) : 'Not yet'} />
          <Field
            label="Ex-factory"
            value={formatDate(order.revisedExFactoryDate ?? order.exFactoryDate)}
            hint={order.revisedExFactoryDate ? `revised from ${formatDate(order.exFactoryDate)}` : undefined}
            tone={order.delayDays > 0 ? 'danger' : undefined}
          />
          <Field label="Delivery" value={formatDate(order.deliveryDate)} />
        </dl>
      </Panel>

      <div className="flex flex-col gap-4">
        <Panel title="Progress">
          <div className="flex flex-col gap-4">
            <div>
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span className="text-xs text-muted">Production</span>
                <span className="text-sm font-semibold tabular-nums text-text">
                  {completion.toFixed(0)}%
                </span>
              </div>
              <Progress
                value={completion}
                tone={order.risk === 'DELAYED' ? 'danger' : completion >= 99 ? 'success' : 'primary'}
              />
              <p className="mt-1.5 text-[11px] text-muted">
                {formatNumber(producedTotal)} of {formatNumber(plannedTotal)} stage-units complete
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-3">
              <Field label="Lifecycle" value={<StatusBadge value={order.status} />} />
              <Field label="Risk" value={<StatusBadge kind="risk" value={order.risk} />} />
              <Field
                label="Samples"
                value={`${(order.samples ?? []).filter((sample) => sample.status === 'APPROVED').length}/${(order.samples ?? []).length} approved`}
              />
              <Field
                label="Wash / print"
                value={order.hasWash ? 'Required' : 'Not required'}
              />
            </dl>
          </div>
        </Panel>

        <Panel title="Needs attention">
          {attention.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Nothing outstanding on this order.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {attention.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.text} className="flex items-start gap-2.5 text-sm">
                    <Badge tone={item.tone} size="sm" className="mt-0.5 shrink-0">
                      <Icon className="size-3" aria-hidden="true" />
                    </Badge>
                    <span className="text-muted">{item.text}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}

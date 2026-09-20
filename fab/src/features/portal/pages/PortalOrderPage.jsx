import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, CircleDashed, Package, Ship } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Badge, Card, CardBody, CardHeader, CardTitle, EmptyState, PageSpinner, Progress, Stepper } from '@/components/ui'
import { Breadcrumbs, StatusBadge, Timeline } from '@/components/shared'
import { useAsync } from '@/hooks'
import { getOrder360 } from '@/services/orderService'
import { PRODUCTION_STAGES, orderLifecycleSteps } from '@/config/statuses'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'
import { usePortalClient } from '../hooks/usePortalClient'

/** Client portal → one order's tracking view. Read-only, and scoped to the brand. */
export function PortalOrderPage() {
  const { id } = useParams()
  const { clientId } = usePortalClient()

  const load = useCallback(() => getOrder360(id), [id])
  const { data: order, loading } = useAsync(load, [id])

  if (loading && !order) return <PageSpinner label="Loading order" />

  // A client may only open their own orders.
  if (!order || order.clientId !== clientId) {
    return (
      <Card>
        <EmptyState
          icon={Package}
          title="Order not found"
          description="This order isn't on your account."
        />
      </Card>
    )
  }

  const steps = orderLifecycleSteps(order)
  const currentIndex = Math.max(0, steps.findIndex((step) => step.value === order.status))
  const stages = order.productionStages ?? []
  const planned = stages.reduce((sum, stage) => sum + stage.quantityPlanned, 0)
  const done = stages.reduce((sum, stage) => sum + stage.quantityDone, 0)

  return (
    <div>
      <Breadcrumbs
        className="mb-3"
        items={[{ label: 'My orders', to: '/portal/orders' }, { label: order.poNumber }]}
      />

      <Card className="mb-5">
        <CardBody>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight text-text">{order.poNumber}</h1>
                <StatusBadge value={order.status} withIcon />
                {order.risk === 'DELAYED' && (
                  <Badge tone="danger" dot>
                    {order.delayDays} days behind
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted">
                {order.styleName} · {order.styleNumber} · your PO {order.clientPoNumber}
              </p>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            <Figure label="Quantity" value={`${formatNumber(order.quantity)} pcs`} />
            <Figure label="FOB price" value={formatCurrency(order.fobPrice, 'USD', { decimals: 2 })} />
            <Figure label="Order value" value={formatCurrency(order.orderValue, 'USD', { compact: true })} />
            <Figure
              label="Ex-factory"
              value={formatDate(order.revisedExFactoryDate ?? order.exFactoryDate)}
              hint={order.revisedExFactoryDate ? `revised from ${formatDate(order.exFactoryDate)}` : 'on plan'}
              tone={order.delayDays > 0 ? 'danger' : undefined}
            />
            <Figure label="Delivery" value={formatDate(order.deliveryDate)} />
            <Figure label="Incoterm" value={`${order.incoterm} · ${order.paymentTermCode}`} />
          </dl>

          <div className="mt-6 border-t border-border pt-5">
            <Stepper steps={steps} current={currentIndex} />
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            actions={
              planned > 0 && (
                <span className="text-xs text-muted">
                  {formatNumber(done)} / {formatNumber(planned)} pcs
                </span>
              )
            }
          >
            <CardTitle>Production progress</CardTitle>
          </CardHeader>
          <CardBody>
            {stages.length === 0 ? (
              <EmptyState
                title="Production hasn’t started"
                description="Stage tracking begins once fabric is in-house at the unit."
                compact
              />
            ) : (
              <ol className="flex flex-col gap-3">
                {stages.map((stage) => {
                  const meta = PRODUCTION_STAGES[stage.stage]
                  const percent =
                    stage.quantityPlanned > 0
                      ? (stage.quantityDone / stage.quantityPlanned) * 100
                      : 0
                  return (
                    <li key={stage.id} className="flex items-center gap-3">
                      <span className="w-32 shrink-0 truncate text-sm text-text">
                        {meta?.label ?? stage.stage}
                      </span>
                      <Progress
                        value={percent}
                        className="flex-1"
                        tone={
                          stage.status === 'COMPLETED'
                            ? 'success'
                            : stage.status === 'DELAYED'
                              ? 'danger'
                              : 'primary'
                        }
                      />
                      <span className="w-32 shrink-0 text-right text-xs tabular-nums text-muted">
                        {percent.toFixed(0)}%
                        <span className="ml-1.5">
                          <StatusBadge kind="stageStatus" value={stage.status} size="sm" dot={false} />
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ol>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipment</CardTitle>
          </CardHeader>
          <CardBody>
            {!order.shipment ? (
              <EmptyState
                icon={Ship}
                title="Not booked yet"
                description="We'll book once the final inspection passes."
                compact
              />
            ) : (
              <>
                <dl className="mb-4 grid grid-cols-2 gap-3">
                  <Figure label="Carrier" value={order.shipment.carrier} />
                  <Figure
                    label={order.shipment.mode === 'AIR' ? 'AWB' : 'B/L'}
                    value={order.shipment.blNumber}
                  />
                  <Figure label="ETD" value={formatDate(order.shipment.etd)} />
                  <Figure label="ETA" value={formatDate(order.shipment.eta)} />
                </dl>
                <Timeline
                  relative={false}
                  items={order.shipment.milestones.map((milestone, index) => ({
                    id: `${order.shipment.id}-${index}`,
                    title: milestone.label,
                    at: `${milestone.date}T09:00:00.000Z`,
                    tone: milestone.done ? 'success' : 'default',
                    icon: milestone.done ? CheckCircle2 : CircleDashed,
                    done: milestone.done,
                  }))}
                />
              </>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Samples</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {(order.samples ?? []).length === 0 ? (
              <EmptyState title="No samples yet" compact />
            ) : (
              <ul className="divide-y divide-border">
                {order.samples.map((sample) => (
                  <li key={sample.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className="text-sm text-text">
                        {sample.type.replace('_', ' ')} · {sample.reference}
                      </span>
                      <span className="text-xs text-muted">
                        sent {formatDate(sample.sentAt)}
                        {sample.comments && ` · ${sample.comments}`}
                      </span>
                    </span>
                    <StatusBadge kind="approval" value={sample.status} size="sm" />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            actions={
              <Link to="/portal/orders" className="text-xs font-medium text-primary hover:underline">
                All orders
              </Link>
            }
          >
            <CardTitle>Updates from us</CardTitle>
          </CardHeader>
          <CardBody>
            <Timeline
              items={(order.clientUpdates ?? []).map((update) => ({
                id: update.id,
                title: update.subject,
                description: update.body,
                at: update.sentAt,
                tone: 'info',
              }))}
              emptyTitle="No updates yet"
              emptyDescription="We post progress notes here as the order moves."
            />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function Figure({ label, value, hint, tone }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd
        className={cn('mt-0.5 truncate text-sm font-semibold text-text', tone === 'danger' && 'text-danger')}
      >
        {value}
      </dd>
      {hint && <p className="truncate text-[11px] text-muted">{hint}</p>}
    </div>
  )
}

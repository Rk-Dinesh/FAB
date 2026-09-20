import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Package, Truck, Wallet } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Badge, Card, CardBody, EmptyState, Progress, Select, Skeleton } from '@/components/ui'
import { KpiCard, KpiGrid, PageHeader, StatusBadge } from '@/components/shared'
import { useAsync } from '@/hooks'
import { orderService } from '@/services/orderService'
import { table } from '@/mocks/db'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'
import { usePortalClient } from '../hooks/usePortalClient'

/** Client portal → My orders. */
export function PortalOrdersPage() {
  const { clientId, client } = usePortalClient()
  const [status, setStatus] = useState('live')

  const load = useCallback(async () => {
    const orders = await orderService.list({ filters: { clientId } })
    const stages = table('productionStages')
    return orders.map((order) => {
      const orderStages = stages.filter((stage) => stage.orderId === order.id)
      const planned = orderStages.reduce((sum, stage) => sum + stage.quantityPlanned, 0)
      const done = orderStages.reduce((sum, stage) => sum + stage.quantityDone, 0)
      return {
        ...order,
        completion: planned > 0 ? (done / planned) * 100 : order.statusIndex >= 10 ? 100 : 0,
      }
    })
  }, [clientId])

  const { data, loading, error } = useAsync(load, [clientId], { enabled: Boolean(clientId) })
  const orders = useMemo(() => data ?? [], [data])

  const filtered = useMemo(
    () =>
      orders.filter((order) => {
        if (status === 'live') return order.statusIndex >= 5 && order.statusIndex < 12
        if (status === 'shipped') return order.statusIndex >= 11
        if (status === 'development') return order.statusIndex < 5
        return true
      }),
    [orders, status],
  )

  const stats = useMemo(() => {
    const live = orders.filter((order) => order.statusIndex >= 5 && order.statusIndex < 12)
    return {
      live: live.length,
      units: live.reduce((sum, order) => sum + order.quantity, 0),
      value: live.reduce((sum, order) => sum + order.orderValue, 0),
      delayed: orders.filter((order) => order.risk === 'DELAYED').length,
    }
  }, [orders])

  return (
    <div>
      <PageHeader
        title={client ? `${client.name} orders` : 'My orders'}
        description="Everything we are making for you, and where each order stands right now."
        actions={
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            containerClassName="w-48"
            aria-label="Filter orders"
            options={[
              { value: 'live', label: 'In production' },
              { value: 'development', label: 'In development' },
              { value: 'shipped', label: 'Shipped & closed' },
              { value: 'all', label: 'All orders' },
            ]}
          />
        }
      />

      <KpiGrid className="mb-5">
        <KpiCard label="Live orders" value={stats.live} icon={Package} tone="primary" loading={loading} />
        <KpiCard label="Units in progress" value={formatNumber(stats.units)} icon={Truck} tone="info" loading={loading} />
        <KpiCard
          label="Order value"
          value={formatCurrency(stats.value, 'USD', { compact: true })}
          icon={Wallet}
          tone="success"
          loading={loading}
        />
        <KpiCard
          label="Running late"
          value={stats.delayed}
          icon={AlertTriangle}
          tone={stats.delayed > 0 ? 'danger' : 'success'}
          loading={loading}
        />
      </KpiGrid>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <EmptyState title="Couldn’t load your orders" description={error.message} />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Package}
            title="Nothing here yet"
            description="Orders appear as soon as your PO is confirmed."
          />
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((order) => (
            <li key={order.id}>
              <Card hoverable>
                <Link to={`/portal/orders/${order.id}`} className="block">
                  <CardBody>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-text">{order.poNumber}</span>
                          <StatusBadge value={order.status} size="sm" />
                          {order.risk === 'DELAYED' && (
                            <Badge tone="danger" size="sm" dot>
                              {order.delayDays} days late
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-muted">
                          {order.styleName} · {order.styleNumber} · {formatNumber(order.quantity)} pcs
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums text-text">
                          {formatCurrency(order.orderValue, 'USD', { compact: true })}
                        </p>
                        <p className="text-xs text-muted">
                          {formatCurrency(order.fobPrice, 'USD', { decimals: 2 })} FOB
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                      <div className="min-w-48 flex-1">
                        <Progress
                          value={order.completion}
                          tone={
                            order.risk === 'DELAYED'
                              ? 'danger'
                              : order.completion >= 99
                                ? 'success'
                                : 'primary'
                          }
                        />
                        <p className="mt-1 text-[11px] text-muted">
                          {order.completion.toFixed(0)}% through production
                        </p>
                      </div>
                      <dl className="flex gap-6 text-xs">
                        <div>
                          <dt className="text-muted">Ex-factory</dt>
                          <dd
                            className={cn(
                              'font-medium text-text',
                              order.revisedExFactoryDate && 'text-danger',
                            )}
                          >
                            {formatDate(order.revisedExFactoryDate ?? order.exFactoryDate)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted">Delivery</dt>
                          <dd className="font-medium text-text">{formatDate(order.deliveryDate)}</dd>
                        </div>
                        <div>
                          <dt className="text-muted">Season</dt>
                          <dd className="font-medium text-text">{order.season}</dd>
                        </div>
                      </dl>
                    </div>
                  </CardBody>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

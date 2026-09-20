import { useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Anchor, CheckCircle2, CircleDashed, Package, Plane, Ship } from 'lucide-react'
import { Badge, Card, CardBody, EmptyState, Progress, Skeleton } from '@/components/ui'
import { KpiCard, KpiGrid, PageHeader, StatusBadge } from '@/components/shared'
import { useAsync } from '@/hooks'
import { shipmentService } from '@/services/logisticsService'
import { table } from '@/mocks/db'
import { formatDate, formatNumber } from '@/utils/format'
import { usePortalClient } from '../hooks/usePortalClient'

const DAY_MS = 86400000
const TODAY_MS = new Date(new Date().toISOString().slice(0, 10)).getTime()

/** Client portal → Shipments: what is on the water and when it lands. */
export function PortalShipmentsPage() {
  const { clientId } = usePortalClient()

  const load = useCallback(() => shipmentService.list({ filters: { clientId } }), [clientId])
  const { data, loading, error } = useAsync(load, [clientId], { enabled: Boolean(clientId) })

  const portsById = useMemo(
    () => Object.fromEntries(table('ports').map((port) => [port.id, port])),
    [],
  )

  const shipments = useMemo(
    () =>
      (data ?? [])
        .map((shipment) => {
          const etd = new Date(`${shipment.etd}T00:00:00.000Z`).getTime()
          const eta = new Date(`${shipment.eta}T00:00:00.000Z`).getTime()
          const span = Math.max(1, eta - etd)
          return {
            ...shipment,
            percent:
              shipment.status === 'DELIVERED' || shipment.status === 'ARRIVED'
                ? 100
                : Math.min(100, Math.max(0, ((TODAY_MS - etd) / span) * 100)),
            daysRemaining: Math.max(0, Math.round((eta - TODAY_MS) / DAY_MS)),
            originPort: portsById[shipment.originPortId],
            destinationPort: portsById[shipment.destinationPortId],
          }
        })
        .sort((left, right) => left.eta.localeCompare(right.eta)),
    [data, portsById],
  )

  const stats = useMemo(
    () => ({
      inTransit: shipments.filter((entry) => entry.status === 'IN_TRANSIT').length,
      cartons: shipments
        .filter((entry) => entry.status === 'IN_TRANSIT')
        .reduce((sum, entry) => sum + entry.cartons, 0),
      delivered: shipments.filter((entry) => entry.status === 'DELIVERED').length,
    }),
    [shipments],
  )

  return (
    <div>
      <PageHeader
        title="Shipments"
        description="Bookings on your account, with their current position and arrival date."
      />

      <KpiGrid className="mb-5" columns={3}>
        <KpiCard label="On the water" value={stats.inTransit} icon={Ship} tone="primary" loading={loading} />
        <KpiCard label="Cartons in transit" value={formatNumber(stats.cartons)} icon={Package} tone="info" loading={loading} />
        <KpiCard label="Delivered" value={stats.delivered} icon={CheckCircle2} tone="success" loading={loading} />
      </KpiGrid>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <EmptyState title="Couldn’t load your shipments" description={error.message} />
        </Card>
      ) : shipments.length === 0 ? (
        <Card>
          <EmptyState
            icon={Ship}
            title="Nothing shipping yet"
            description="Shipments appear here as soon as we book them."
          />
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {shipments.map((shipment) => (
            <li key={shipment.id}>
              <Card>
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/portal/orders/${shipment.orderId}`}
                          className="text-sm font-semibold text-text hover:text-primary hover:underline"
                        >
                          {shipment.poNumber}
                        </Link>
                        <StatusBadge kind="shipment" value={shipment.status} size="sm" />
                        <Badge tone={shipment.mode === 'AIR' ? 'warning' : 'info'} size="sm">
                          {shipment.mode === 'AIR' ? (
                            <Plane className="size-3" aria-hidden="true" />
                          ) : (
                            <Ship className="size-3" aria-hidden="true" />
                          )}
                          {shipment.carrier}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">
                        {shipment.mode === 'AIR' ? 'AWB' : 'B/L'} {shipment.blNumber} ·{' '}
                        {formatNumber(shipment.cartons)} cartons ·{' '}
                        {formatNumber(shipment.grossWeightKg, 0)} kg
                      </p>
                    </div>
                    <p className="shrink-0 text-right text-xs text-muted">
                      {shipment.status === 'IN_TRANSIT'
                        ? `${shipment.daysRemaining} days to arrival`
                        : shipment.status === 'BOOKED'
                          ? `Departs ${formatDate(shipment.etd)}`
                          : `Arrived ${formatDate(shipment.ata ?? shipment.eta)}`}
                    </p>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-xs text-text">
                      <span>
                        {shipment.originPort?.name}{' '}
                        <span className="text-muted">· {formatDate(shipment.etd)}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-muted">{formatDate(shipment.eta)} ·</span>
                        {shipment.destinationPort?.name}
                        <Anchor className="size-3.5 text-muted" aria-hidden="true" />
                      </span>
                    </div>
                    <Progress
                      value={shipment.percent}
                      tone={shipment.percent >= 100 ? 'success' : 'primary'}
                    />
                  </div>

                  <ol className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
                    {shipment.milestones.map((milestone, index) => (
                      <li key={index} className="flex items-center gap-1.5">
                        {milestone.done ? (
                          <CheckCircle2 className="size-3.5 text-success" aria-hidden="true" />
                        ) : (
                          <CircleDashed className="size-3.5 text-muted" aria-hidden="true" />
                        )}
                        <span className={milestone.done ? 'text-[11px] text-text' : 'text-[11px] text-muted'}>
                          {milestone.label}
                        </span>
                      </li>
                    ))}
                  </ol>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

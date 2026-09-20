import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Anchor, CheckCircle2, CircleDashed, MapPin, Plane, Ship } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Badge, Button, Card, CardBody, EmptyState, Progress, Skeleton } from '@/components/ui'
import { FilterBar, KpiCard, KpiGrid, PageHeader, StatusBadge } from '@/components/shared'
import { useAsync } from '@/hooks'
import { shipmentService } from '@/services/logisticsService'
import { table } from '@/mocks/db'
import { formatDate, formatNumber } from '@/utils/format'

const DAY_MS = 86400000
const TODAY_MS = new Date(new Date().toISOString().slice(0, 10)).getTime()

/** Logistics → Tracking: where each in-flight shipment is on its voyage. */
export function TrackingPage() {
  const [filters, setFilters] = useState({})

  const load = useCallback(() => shipmentService.list(), [])
  const { data, loading, error, reload } = useAsync(load)
  const shipments = useMemo(() => data ?? [], [data])

  const portsById = useMemo(
    () => Object.fromEntries(table('ports').map((port) => [port.id, port])),
    [],
  )

  /** Voyage progress from ETD to ETA. */
  const tracked = useMemo(
    () =>
      shipments
        .map((shipment) => {
          const etd = new Date(`${shipment.etd}T00:00:00.000Z`).getTime()
          const eta = new Date(`${shipment.eta}T00:00:00.000Z`).getTime()
          const span = Math.max(1, eta - etd)
          const elapsed = TODAY_MS - etd
          const percent =
            shipment.status === 'DELIVERED' || shipment.status === 'ARRIVED'
              ? 100
              : Math.min(100, Math.max(0, (elapsed / span) * 100))
          return {
            ...shipment,
            percent,
            daysRemaining: Math.max(0, Math.round((eta - TODAY_MS) / DAY_MS)),
            transitDays: Math.round(span / DAY_MS),
            originPort: portsById[shipment.originPortId],
            destinationPort: portsById[shipment.destinationPortId],
          }
        })
        .sort((left, right) => left.eta.localeCompare(right.eta)),
    [shipments, portsById],
  )

  const filtered = tracked.filter((shipment) => {
    if (filters.status && shipment.status !== filters.status) return false
    if (filters.mode && shipment.mode !== filters.mode) return false
    return true
  })

  const stats = useMemo(
    () => ({
      moving: tracked.filter((entry) => entry.status === 'IN_TRANSIT').length,
      arrivingSoon: tracked.filter(
        (entry) => entry.status === 'IN_TRANSIT' && entry.daysRemaining <= 7,
      ).length,
      delivered: tracked.filter((entry) => entry.status === 'DELIVERED').length,
      cartons: tracked
        .filter((entry) => entry.status === 'IN_TRANSIT')
        .reduce((sum, entry) => sum + entry.cartons, 0),
    }),
    [tracked],
  )

  const filterConfig = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'BOOKED', label: 'Booked' },
        { value: 'IN_TRANSIT', label: 'In transit' },
        { value: 'ARRIVED', label: 'Arrived' },
        { value: 'DELIVERED', label: 'Delivered' },
      ],
    },
    {
      key: 'mode',
      label: 'Mode',
      width: 'w-36',
      options: [
        { value: 'SEA', label: 'Sea' },
        { value: 'AIR', label: 'Air' },
      ],
    },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Shipment tracking"
        description="Where every booking is between the origin port and the consignee."
        breadcrumbs={[{ label: 'Logistics' }, { label: 'Tracking' }]}
      />

      <KpiGrid className="mb-5">
        <KpiCard label="In transit" value={stats.moving} icon={Ship} tone="primary" loading={loading} />
        <KpiCard
          label="Arriving within 7 days"
          value={stats.arrivingSoon}
          icon={Anchor}
          tone="warning"
          loading={loading}
        />
        <KpiCard label="Cartons on the water" value={formatNumber(stats.cartons)} tone="info" loading={loading} />
        <KpiCard label="Delivered" value={stats.delivered} icon={CheckCircle2} tone="success" loading={loading} />
      </KpiGrid>

      <FilterBar filters={filterConfig} values={filters} onChange={setFilters} className="mb-4" />

      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <EmptyState
            title="Couldn’t load tracking"
            description={error.message}
            action={
              <Button variant="secondary" onClick={reload}>
                Try again
              </Button>
            }
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Ship}
            title="Nothing to track"
            description="Shipments appear here once they are booked."
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((shipment) => (
            <Card key={shipment.id}>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/app/orders/${shipment.orderId}`}
                        className="text-sm font-semibold text-text hover:text-primary hover:underline"
                      >
                        {shipment.poNumber}
                      </Link>
                      <span className="text-sm text-muted">· {shipment.clientName}</span>
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
                      {shipment.reference} · {shipment.blNumber} ·{' '}
                      {formatNumber(shipment.cartons)} cartons
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted">
                      {shipment.status === 'IN_TRANSIT'
                        ? `${shipment.daysRemaining} days to arrival`
                        : shipment.status === 'BOOKED'
                          ? `Departs ${formatDate(shipment.etd)}`
                          : `Arrived ${formatDate(shipment.ata ?? shipment.eta)}`}
                    </p>
                    <p className="text-sm font-semibold tabular-nums text-text">
                      {shipment.percent.toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-text">
                      <MapPin className="size-3.5 text-muted" aria-hidden="true" />
                      {shipment.originPort?.name}
                      <span className="text-muted">· {formatDate(shipment.etd)}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-text">
                      <span className="text-muted">{formatDate(shipment.eta)} ·</span>
                      {shipment.destinationPort?.name}
                      <Anchor className="size-3.5 text-muted" aria-hidden="true" />
                    </span>
                  </div>
                  <Progress
                    value={shipment.percent}
                    tone={shipment.percent >= 100 ? 'success' : 'primary'}
                  />
                  <p className="mt-1 text-[11px] text-muted">
                    {shipment.transitDays}-day transit · {shipment.incoterm}
                  </p>
                </div>

                <ol className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                  {shipment.milestones.map((milestone, index) => (
                    <li key={index} className="flex items-center gap-1.5">
                      {milestone.done ? (
                        <CheckCircle2 className="size-3.5 text-success" aria-hidden="true" />
                      ) : (
                        <CircleDashed className="size-3.5 text-muted" aria-hidden="true" />
                      )}
                      <span
                        className={cn(
                          'text-[11px]',
                          milestone.done ? 'text-text' : 'text-muted',
                        )}
                      >
                        {milestone.label}
                      </span>
                      <span className="text-[11px] text-muted">
                        {formatDate(milestone.date, 'dd MMM')}
                      </span>
                    </li>
                  ))}
                </ol>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Boxes, Plane, Ship, Weight } from 'lucide-react'
import { Badge, Button, Drawer } from '@/components/ui'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader, StatusBadge, Timeline } from '@/components/shared'
import { useAsync } from '@/hooks'
import { getShipmentDetail, shipmentService } from '@/services/logisticsService'
import { table } from '@/mocks/db'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'

/** Logistics → Shipments: booking, in-transit status and the detail drawer. */
export function ShipmentsPage() {
  const [filters, setFilters] = useState({})
  const [selectedId, setSelectedId] = useState(null)

  const load = useCallback(() => shipmentService.list(), [])
  const { data, loading, error, reload } = useAsync(load)
  const shipments = useMemo(() => data ?? [], [data])

  const portsById = useMemo(
    () => Object.fromEntries(table('ports').map((port) => [port.id, port])),
    [],
  )

  const stats = useMemo(
    () => ({
      total: shipments.length,
      inTransit: shipments.filter((entry) => entry.status === 'IN_TRANSIT').length,
      cartons: shipments.reduce((sum, entry) => sum + entry.cartons, 0),
      freight: shipments.reduce((sum, entry) => sum + entry.freightCostUsd, 0),
    }),
    [shipments],
  )

  const columns = useMemo(
    () => [
      {
        accessorKey: 'reference',
        header: 'Shipment',
        cell: ({ row }) => (
          <span className="flex flex-col leading-tight">
            <span className="font-medium text-text">{row.original.reference}</span>
            <span className="text-xs text-muted">{row.original.blNumber}</span>
          </span>
        ),
      },
      {
        accessorKey: 'poNumber',
        header: 'Order',
        cell: ({ row }) => (
          <span onClick={(event) => event.stopPropagation()} role="presentation">
            <Link to={`/app/orders/${row.original.orderId}`} className="text-primary hover:underline">
              {row.original.poNumber}
            </Link>
          </span>
        ),
      },
      { accessorKey: 'clientName', header: 'Client' },
      {
        accessorKey: 'mode',
        header: 'Mode',
        cell: ({ getValue }) => (
          <Badge tone={getValue() === 'AIR' ? 'warning' : 'info'} size="sm">
            {getValue() === 'AIR' ? (
              <Plane className="size-3" aria-hidden="true" />
            ) : (
              <Ship className="size-3" aria-hidden="true" />
            )}
            {getValue().toLowerCase()}
          </Badge>
        ),
      },
      { accessorKey: 'carrier', header: 'Carrier' },
      {
        accessorKey: 'destinationPortId',
        header: 'Destination',
        meta: { csv: (row) => row.destinationPortId },
        cell: ({ getValue }) => portsById[getValue()]?.name ?? getValue(),
      },
      {
        accessorKey: 'cartons',
        header: 'Cartons',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatNumber(getValue()),
      },
      {
        accessorKey: 'etd',
        header: 'ETD',
        cell: ({ getValue }) => formatDate(getValue()),
      },
      {
        accessorKey: 'eta',
        header: 'ETA',
        cell: ({ getValue }) => formatDate(getValue()),
      },
      {
        accessorKey: 'freightCostUsd',
        header: 'Freight',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD'),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge kind="shipment" value={getValue()} />,
      },
    ],
    [portsById],
  )

  const filterConfig = [
    {
      key: 'mode',
      label: 'Mode',
      width: 'w-36',
      options: [
        { value: 'SEA', label: 'Sea' },
        { value: 'AIR', label: 'Air' },
      ],
    },
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
    { key: 'etd', label: 'ETD', type: 'dateRange' },
  ]

  const filtered = shipments.filter((entry) => {
    if (filters.mode && entry.mode !== filters.mode) return false
    if (filters.status && entry.status !== filters.status) return false
    if (filters.etd?.from && entry.etd < filters.etd.from) return false
    if (filters.etd?.to && entry.etd > filters.etd.to) return false
    return true
  })

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Shipments"
        description="Bookings out of Chennai and Tuticorin, with their in-transit status."
        breadcrumbs={[{ label: 'Logistics' }, { label: 'Shipments' }]}
      />

      <KpiGrid className="mb-5">
        <KpiCard label="Shipments" value={stats.total} icon={Ship} tone="primary" loading={loading} />
        <KpiCard label="In transit" value={stats.inTransit} icon={Plane} tone="info" loading={loading} />
        <KpiCard label="Cartons shipped" value={formatNumber(stats.cartons)} icon={Boxes} tone="success" loading={loading} />
        <KpiCard
          label="Freight spend"
          value={formatCurrency(stats.freight, 'USD', { compact: true })}
          icon={Weight}
          tone="warning"
          loading={loading}
        />
      </KpiGrid>

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={reload}
        onRowClick={(shipment) => setSelectedId(shipment.id)}
        filters={<FilterBar filters={filterConfig} values={filters} onChange={setFilters} />}
        exportFileName="apparelflow-shipments"
        searchPlaceholder="Search shipments…"
        emptyTitle="No shipments match these filters"
        initialSort={[{ id: 'etd', desc: true }]}
      />

      <ShipmentDrawer shipmentId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

function ShipmentDrawer({ shipmentId, onClose }) {
  const load = useCallback(
    () => (shipmentId ? getShipmentDetail(shipmentId) : Promise.resolve(null)),
    [shipmentId],
  )
  const { data, loading } = useAsync(load, [shipmentId], { enabled: Boolean(shipmentId) })

  return (
    <Drawer
      open={Boolean(shipmentId)}
      onClose={onClose}
      title={data?.reference ?? 'Shipment'}
      description={data ? `${data.poNumber} · ${data.clientName}` : undefined}
      size="lg"
      footer={
        data?.order && (
          <Button as={Link} to={`/app/orders/${data.order.id}`} variant="secondary">
            Open order 360
          </Button>
        )
      }
    >
      {loading || !data ? (
        <p className="text-sm text-muted">Loading shipment…</p>
      ) : (
        <div className="flex flex-col gap-6">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Detail label="Mode" value={data.mode === 'AIR' ? 'Air freight' : 'Ocean freight'} />
            <Detail label="Carrier" value={data.carrier} />
            <Detail label={data.mode === 'AIR' ? 'AWB' : 'B/L'} value={data.blNumber} />
            <Detail label="Container" value={data.containerNumber ?? '—'} />
            <Detail label="Origin" value={data.originPort?.name} />
            <Detail label="Destination" value={data.destinationPort?.name} />
            <Detail label="Cartons" value={formatNumber(data.cartons)} />
            <Detail label="Gross weight" value={`${formatNumber(data.grossWeightKg, 1)} kg`} />
            <Detail label="Volume" value={`${data.cbm} CBM`} />
            <Detail label="Freight" value={formatCurrency(data.freightCostUsd, 'USD')} />
            <Detail label="ETD" value={formatDate(data.etd)} />
            <Detail label="ETA" value={formatDate(data.eta)} />
          </dl>

          {data.notes && (
            <p className="rounded-lg border border-border bg-surface-2/40 p-3 text-sm text-muted">
              {data.notes}
            </p>
          )}

          <section>
            <h3 className="mb-2 text-sm font-semibold text-text">Tracking</h3>
            <Timeline
              relative={false}
              items={data.milestones.map((milestone, index) => ({
                id: `${data.id}-${index}`,
                title: milestone.label,
                at: `${milestone.date}T09:00:00.000Z`,
                tone: milestone.done ? 'success' : 'default',
                done: milestone.done,
              }))}
            />
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-text">Documents</h3>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {data.documents.map((document) => (
                <li key={document.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-text">{document.name}</span>
                    <span className="block text-xs text-muted">{document.number}</span>
                  </span>
                  <Badge tone={document.status === 'ISSUED' ? 'success' : 'default'} size="sm" dot>
                    {document.status.toLowerCase()}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </Drawer>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-text">{value ?? '—'}</dd>
    </div>
  )
}

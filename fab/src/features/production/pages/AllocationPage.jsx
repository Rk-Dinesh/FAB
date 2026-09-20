import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Factory, Gauge, Layers, Users } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Badge, Card, CardBody, CardHeader, CardTitle, Progress } from '@/components/ui'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader } from '@/components/shared'
import { useAsync } from '@/hooks'
import { allocationService } from '@/services/productionService'
import { table } from '@/mocks/db'
import { formatDate, formatNumber } from '@/utils/format'

const STATUS_TONES = { PLANNED: 'info', RUNNING: 'primary', COMPLETED: 'success' }

/** Production → Allocation: which order runs in which factory, and how loaded each is. */
export function AllocationPage() {
  const [filters, setFilters] = useState({})

  const load = useCallback(() => allocationService.list(), [])
  const { data, loading, error, reload } = useAsync(load)
  const allocations = useMemo(() => data ?? [], [data])

  const vendorsById = useMemo(
    () => Object.fromEntries(table('vendors').map((vendor) => [vendor.id, vendor])),
    [],
  )

  /** Load per factory, so an over-committed unit is obvious. */
  const factoryLoad = useMemo(() => {
    const byVendor = new Map()
    for (const allocation of allocations) {
      if (allocation.status === 'COMPLETED') continue
      const entry = byVendor.get(allocation.vendorId) ?? {
        vendorId: allocation.vendorId,
        orders: 0,
        units: 0,
        lines: 0,
        dailyCapacity: 0,
      }
      entry.orders += 1
      entry.units += allocation.quantity
      entry.lines += allocation.lineCount
      entry.dailyCapacity += allocation.dailyCapacity
      byVendor.set(allocation.vendorId, entry)
    }
    return [...byVendor.values()]
      .map((entry) => ({
        ...entry,
        vendor: vendorsById[entry.vendorId],
        daysOfWork: entry.dailyCapacity > 0 ? Math.round(entry.units / entry.dailyCapacity) : 0,
      }))
      .sort((left, right) => right.units - left.units)
  }, [allocations, vendorsById])

  const stats = useMemo(
    () => ({
      total: allocations.length,
      running: allocations.filter((entry) => entry.status === 'RUNNING').length,
      units: allocations
        .filter((entry) => entry.status !== 'COMPLETED')
        .reduce((sum, entry) => sum + entry.quantity, 0),
      factories: new Set(allocations.map((entry) => entry.vendorId)).size,
    }),
    [allocations],
  )

  const columns = useMemo(
    () => [
      {
        accessorKey: 'poNumber',
        header: 'Order',
        cell: ({ row }) => (
          <span onClick={(event) => event.stopPropagation()} role="presentation">
            <Link
              to={`/app/orders/${row.original.orderId}`}
              className="font-medium text-primary hover:underline"
            >
              {row.original.poNumber}
            </Link>
          </span>
        ),
      },
      { accessorKey: 'clientName', header: 'Client' },
      {
        accessorKey: 'vendorId',
        header: 'Factory',
        meta: { csv: (row) => row.vendorId },
        cell: ({ getValue }) => (
          <span className="flex flex-col leading-tight">
            <span className="text-text">{vendorsById[getValue()]?.name ?? getValue()}</span>
            <span className="text-xs text-muted">{vendorsById[getValue()]?.city}</span>
          </span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatNumber(getValue()),
      },
      { accessorKey: 'lineCount', header: 'Lines', meta: { align: 'right' } },
      {
        accessorKey: 'dailyCapacity',
        header: 'Daily capacity',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatNumber(getValue()),
      },
      {
        id: 'window',
        accessorFn: (row) => row.plannedStart,
        header: 'Planned window',
        cell: ({ row }) =>
          `${formatDate(row.original.plannedStart, 'dd MMM')} – ${formatDate(row.original.plannedEnd, 'dd MMM')}`,
      },
      {
        id: 'days',
        accessorFn: (row) => (row.dailyCapacity > 0 ? Math.round(row.quantity / row.dailyCapacity) : 0),
        header: 'Days of work',
        meta: { align: 'right' },
        cell: ({ getValue }) => `${getValue()} d`,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => (
          <Badge tone={STATUS_TONES[getValue()] ?? 'default'} dot>
            {getValue().toLowerCase()}
          </Badge>
        ),
      },
    ],
    [vendorsById],
  )

  const filterConfig = [
    {
      key: 'vendorId',
      label: 'Factory',
      width: 'w-56',
      options: factoryLoad.map((entry) => ({
        value: entry.vendorId,
        label: entry.vendor?.name ?? entry.vendorId,
      })),
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'PLANNED', label: 'Planned' },
        { value: 'RUNNING', label: 'Running' },
        { value: 'COMPLETED', label: 'Completed' },
      ],
    },
  ]

  const filtered = allocations.filter(
    (entry) =>
      (!filters.vendorId || entry.vendorId === filters.vendorId) &&
      (!filters.status || entry.status === filters.status),
  )

  const maxUnits = Math.max(1, ...factoryLoad.map((entry) => entry.units))

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Factory allocation"
        description="Which unit is running which order, and how heavily each one is loaded."
        breadcrumbs={[{ label: 'Production' }, { label: 'Allocation' }]}
      />

      <KpiGrid className="mb-5">
        <KpiCard label="Allocations" value={stats.total} icon={Layers} tone="primary" loading={loading} />
        <KpiCard label="Running now" value={stats.running} icon={Gauge} tone="warning" loading={loading} />
        <KpiCard label="Units allocated" value={formatNumber(stats.units)} icon={Users} tone="info" loading={loading} />
        <KpiCard label="Factories engaged" value={stats.factories} icon={Factory} tone="success" loading={loading} />
      </KpiGrid>

      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Factory load</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          {factoryLoad.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Nothing allocated yet.</p>
          ) : (
            factoryLoad.map((entry) => (
              <div key={entry.vendorId} className="flex items-center gap-3">
                <span className="w-44 shrink-0 truncate text-sm text-text" title={entry.vendor?.name}>
                  {entry.vendor?.name ?? entry.vendorId}
                </span>
                <Progress
                  value={(entry.units / maxUnits) * 100}
                  className="flex-1"
                  tone={entry.daysOfWork > 30 ? 'danger' : entry.daysOfWork > 18 ? 'warning' : 'primary'}
                />
                <span className="w-40 shrink-0 text-right text-xs tabular-nums text-muted">
                  {formatNumber(entry.units)} pcs ·{' '}
                  <span className={cn(entry.daysOfWork > 30 && 'font-medium text-danger')}>
                    {entry.daysOfWork} days
                  </span>{' '}
                  · {entry.orders} orders
                </span>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={reload}
        filters={<FilterBar filters={filterConfig} values={filters} onChange={setFilters} />}
        exportFileName="apparelflow-allocations"
        searchPlaceholder="Search allocations…"
        emptyTitle="No allocations match these filters"
        initialSort={[{ id: 'window', desc: false }]}
      />
    </div>
  )
}

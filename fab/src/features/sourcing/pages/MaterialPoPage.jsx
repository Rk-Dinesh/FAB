import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Boxes, PackageCheck, Truck, Wallet } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Badge, Progress } from '@/components/ui'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader, StatusBadge } from '@/components/shared'
import { useAsync } from '@/hooks'
import { materialPoService } from '@/services/sourcingService'
import { table } from '@/mocks/db'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'

/** Sourcing → Material PO: what has been ordered from which vendor. */
export function MaterialPoPage() {
  const [filters, setFilters] = useState({})

  const load = useCallback(() => materialPoService.list(), [])
  const { data, loading, error, reload } = useAsync(load)
  const pos = useMemo(() => data ?? [], [data])

  const vendorsById = useMemo(
    () => Object.fromEntries(table('vendors').map((vendor) => [vendor.id, vendor])),
    [],
  )

  const stats = useMemo(
    () => ({
      total: pos.length,
      open: pos.filter((po) => po.status === 'ISSUED' || po.status === 'PARTIAL').length,
      committed: pos.reduce((sum, po) => sum + po.totalValue, 0),
      received: pos.reduce((sum, po) => sum + (po.receivedQuantity / po.quantity) * po.totalValue, 0),
    }),
    [pos],
  )

  const columns = useMemo(
    () => [
      {
        accessorKey: 'reference',
        header: 'PO',
        cell: ({ getValue }) => <span className="font-medium text-text">{getValue()}</span>,
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
      {
        accessorKey: 'vendorId',
        header: 'Vendor',
        meta: { csv: (row) => row.vendorId },
        cell: ({ getValue }) => vendorsById[getValue()]?.name ?? getValue(),
      },
      {
        accessorKey: 'materialName',
        header: 'Material',
        cell: ({ row }) => (
          <span className="flex flex-col leading-tight">
            <span className="text-text">{row.original.materialName}</span>
            <Badge size="sm" tone="outline" className="mt-0.5 w-fit">
              {row.original.materialType}
            </Badge>
          </span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: 'Ordered',
        meta: { align: 'right' },
        cell: ({ row }) => `${formatNumber(row.original.quantity)} ${row.original.uom}`,
      },
      {
        id: 'received',
        accessorFn: (row) => (row.quantity > 0 ? (row.receivedQuantity / row.quantity) * 100 : 0),
        header: 'Received',
        meta: { align: 'right', csv: (row) => row.receivedQuantity },
        cell: ({ row }) => {
          const percent =
            row.original.quantity > 0
              ? (row.original.receivedQuantity / row.original.quantity) * 100
              : 0
          return (
            <span className="flex items-center justify-end gap-2">
              <Progress
                value={percent}
                size="sm"
                tone={percent >= 100 ? 'success' : percent > 0 ? 'warning' : 'primary'}
                className="w-16"
              />
              <span className="w-10 text-right tabular-nums text-text">{percent.toFixed(0)}%</span>
            </span>
          )
        },
      },
      {
        accessorKey: 'totalValue',
        header: 'Value',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD', { compact: true }),
      },
      {
        accessorKey: 'expectedAt',
        header: 'Expected',
        cell: ({ row }) => {
          const late =
            row.original.status !== 'RECEIVED' && new Date(row.original.expectedAt) < new Date()
          return (
            <span className={cn(late && 'font-medium text-danger')}>
              {formatDate(row.original.expectedAt)}
              {late && ' · overdue'}
            </span>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge kind="po" value={getValue()} />,
      },
    ],
    [vendorsById],
  )

  const filterConfig = [
    {
      key: 'materialType',
      label: 'Material',
      width: 'w-40',
      options: [
        { value: 'FABRIC', label: 'Fabric' },
        { value: 'TRIM', label: 'Trims' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'ISSUED', label: 'Issued' },
        { value: 'PARTIAL', label: 'Part received' },
        { value: 'RECEIVED', label: 'Received' },
      ],
    },
  ]

  const filtered = pos.filter(
    (po) =>
      (!filters.materialType || po.materialType === filters.materialType) &&
      (!filters.status || po.status === filters.status),
  )

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Material purchase orders"
        description="Fabric and trims committed to vendors against live orders."
        breadcrumbs={[{ label: 'Sourcing' }, { label: 'Material PO' }]}
      />

      <KpiGrid className="mb-5">
        <KpiCard label="Purchase orders" value={stats.total} icon={Boxes} tone="primary" loading={loading} />
        <KpiCard label="Still open" value={stats.open} icon={Truck} tone="warning" loading={loading} />
        <KpiCard
          label="Committed"
          value={formatCurrency(stats.committed, 'USD', { compact: true })}
          icon={Wallet}
          tone="info"
          loading={loading}
        />
        <KpiCard
          label="Received value"
          value={formatCurrency(stats.received, 'USD', { compact: true })}
          hint={stats.committed > 0 ? `${((stats.received / stats.committed) * 100).toFixed(0)}% of commitment` : undefined}
          icon={PackageCheck}
          tone="success"
          loading={loading}
        />
      </KpiGrid>

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={reload}
        filters={<FilterBar filters={filterConfig} values={filters} onChange={setFilters} />}
        exportFileName="apparelflow-material-pos"
        searchPlaceholder="Search purchase orders…"
        emptyTitle="No purchase orders match these filters"
        initialSort={[{ id: 'expectedAt', desc: false }]}
      />
    </div>
  )
}

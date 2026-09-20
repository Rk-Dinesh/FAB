import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ClipboardCheck, PackageCheck, Scale } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Badge } from '@/components/ui'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader } from '@/components/shared'
import { useAsync } from '@/hooks'
import { grnService } from '@/services/sourcingService'
import { table } from '@/mocks/db'
import { formatDate, formatNumber } from '@/utils/format'

/** Sourcing → GRN: what actually arrived, inspected on the 4-point system. */
export function GrnPage() {
  const [filters, setFilters] = useState({})

  const load = useCallback(() => grnService.list(), [])
  const { data, loading, error, reload } = useAsync(load)
  const grns = useMemo(() => data ?? [], [data])

  const vendorsById = useMemo(
    () => Object.fromEntries(table('vendors').map((vendor) => [vendor.id, vendor])),
    [],
  )

  const stats = useMemo(
    () => ({
      total: grns.length,
      short: grns.filter((grn) => grn.shortfallQuantity > 0).length,
      conditional: grns.filter((grn) => grn.inspectionResult !== 'PASS').length,
      avgScore:
        grns.length > 0
          ? grns.reduce((sum, grn) => sum + grn.fourPointScore, 0) / grns.length
          : 0,
    }),
    [grns],
  )

  const columns = useMemo(
    () => [
      {
        accessorKey: 'reference',
        header: 'GRN',
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
      { accessorKey: 'materialName', header: 'Material' },
      {
        accessorKey: 'orderedQuantity',
        header: 'Ordered',
        meta: { align: 'right' },
        cell: ({ row }) => `${formatNumber(row.original.orderedQuantity)} ${row.original.uom}`,
      },
      {
        accessorKey: 'receivedQuantity',
        header: 'Received',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatNumber(getValue()),
      },
      {
        accessorKey: 'shortfallQuantity',
        header: 'Short',
        meta: { align: 'right' },
        cell: ({ getValue }) =>
          getValue() > 0 ? (
            <span className="font-medium text-danger">{formatNumber(getValue())}</span>
          ) : (
            <span className="text-muted">—</span>
          ),
      },
      {
        accessorKey: 'fourPointScore',
        header: '4-point',
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <span
            className={cn(
              'tabular-nums',
              getValue() > 20 ? 'font-medium text-danger' : 'text-text',
            )}
            title="Defect points per 100 square yards; 20 is the accepted limit"
          >
            {getValue()}
          </span>
        ),
      },
      {
        accessorKey: 'inspectionResult',
        header: 'Inspection',
        cell: ({ getValue }) => (
          <Badge tone={getValue() === 'PASS' ? 'success' : 'warning'} dot>
            {getValue() === 'PASS' ? 'Pass' : 'Conditional'}
          </Badge>
        ),
      },
      {
        accessorKey: 'receivedAt',
        header: 'Received',
        cell: ({ getValue }) => formatDate(getValue()),
      },
      {
        accessorKey: 'remarks',
        header: 'Remarks',
        enableSorting: false,
        meta: { width: '20%' },
        cell: ({ getValue }) => <span className="line-clamp-2 text-xs text-muted">{getValue()}</span>,
      },
    ],
    [vendorsById],
  )

  const filterConfig = [
    {
      key: 'inspectionResult',
      label: 'Inspection',
      options: [
        { value: 'PASS', label: 'Pass' },
        { value: 'CONDITIONAL', label: 'Conditional' },
      ],
    },
    {
      key: 'short',
      label: 'Shortfall',
      width: 'w-40',
      options: [
        { value: 'yes', label: 'Short received' },
        { value: 'no', label: 'Full quantity' },
      ],
    },
  ]

  const filtered = grns.filter((grn) => {
    if (filters.inspectionResult && grn.inspectionResult !== filters.inspectionResult) return false
    if (filters.short === 'yes' && grn.shortfallQuantity === 0) return false
    if (filters.short === 'no' && grn.shortfallQuantity > 0) return false
    return true
  })

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Goods received notes"
        description="Material receipts at the unit, inspected on the 4-point system."
        breadcrumbs={[{ label: 'Sourcing' }, { label: 'GRN' }]}
      />

      <KpiGrid className="mb-5">
        <KpiCard label="Receipts" value={stats.total} icon={PackageCheck} tone="primary" loading={loading} />
        <KpiCard
          label="Short received"
          value={stats.short}
          icon={AlertTriangle}
          tone={stats.short > 0 ? 'danger' : 'success'}
          loading={loading}
        />
        <KpiCard
          label="Conditional pass"
          value={stats.conditional}
          icon={ClipboardCheck}
          tone="warning"
          loading={loading}
        />
        <KpiCard
          label="Average 4-point score"
          value={stats.avgScore.toFixed(1)}
          hint="Limit is 20 per 100 sq yd"
          icon={Scale}
          tone={stats.avgScore <= 20 ? 'success' : 'danger'}
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
        exportFileName="apparelflow-grns"
        searchPlaceholder="Search goods received…"
        emptyTitle="No receipts match these filters"
        initialSort={[{ id: 'receivedAt', desc: true }]}
      />
    </div>
  )
}

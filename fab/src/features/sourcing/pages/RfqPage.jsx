import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GitCompare, Send, Timer, Trophy } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader } from '@/components/shared'
import { useAsync } from '@/hooks'
import { rfqService } from '@/services/sourcingService'
import { table } from '@/mocks/db'
import { formatDate, formatNumber } from '@/utils/format'

const STATUS_TONES = { ISSUED: 'info', QUOTES_IN: 'warning', AWARDED: 'success' }

/** Sourcing → RFQ: requests for quotation and where each one stands. */
export function RfqPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({})

  const load = useCallback(() => rfqService.list(), [])
  const { data, loading, error, reload } = useAsync(load)
  const rfqs = useMemo(() => data ?? [], [data])

  const quoteCounts = useMemo(() => {
    const counts = {}
    for (const quote of table('vendorQuotes')) {
      counts[quote.rfqId] = (counts[quote.rfqId] ?? 0) + 1
    }
    return counts
  }, [])

  const stats = useMemo(
    () => ({
      total: rfqs.length,
      open: rfqs.filter((rfq) => rfq.status === 'ISSUED').length,
      quotesIn: rfqs.filter((rfq) => rfq.status === 'QUOTES_IN').length,
      awarded: rfqs.filter((rfq) => rfq.status === 'AWARDED').length,
    }),
    [rfqs],
  )

  const columns = useMemo(
    () => [
      {
        accessorKey: 'reference',
        header: 'RFQ',
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
      { accessorKey: 'clientName', header: 'Client' },
      { accessorKey: 'materialName', header: 'Material' },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        meta: { align: 'right' },
        cell: ({ row }) => `${formatNumber(row.original.quantity)} ${row.original.uom}`,
      },
      {
        accessorKey: 'requiredBy',
        header: 'Required by',
        cell: ({ getValue }) => formatDate(getValue()),
      },
      {
        id: 'quotes',
        accessorFn: (row) => quoteCounts[row.id] ?? 0,
        header: 'Quotes',
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span className="tabular-nums text-text">
            {quoteCounts[row.original.id] ?? 0} / {row.original.invitedVendorIds.length}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => (
          <Badge tone={STATUS_TONES[getValue()] ?? 'default'} dot>
            {getValue().replace('_', ' ').toLowerCase()}
          </Badge>
        ),
      },
      {
        id: 'compare',
        header: '',
        enableSorting: false,
        enableHiding: false,
        meta: { align: 'right', width: 130 },
        cell: ({ row }) => (
          <span onClick={(event) => event.stopPropagation()} role="presentation">
            <Button
              variant="secondary"
              size="xs"
              onClick={() => navigate(`/app/sourcing/quote-comparison?rfq=${row.original.id}`)}
            >
              <GitCompare className="size-3.5" /> Compare
            </Button>
          </span>
        ),
      },
    ],
    [quoteCounts, navigate],
  )

  const filterConfig = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'ISSUED', label: 'Issued' },
        { value: 'QUOTES_IN', label: 'Quotes in' },
        { value: 'AWARDED', label: 'Awarded' },
      ],
    },
  ]

  const filtered = filters.status ? rfqs.filter((rfq) => rfq.status === filters.status) : rfqs

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Requests for quotation"
        description="Material enquiries out to the vendor base, and the quotes that came back."
        breadcrumbs={[{ label: 'Sourcing' }, { label: 'RFQ' }]}
      />

      <KpiGrid className="mb-5">
        <KpiCard label="RFQs" value={stats.total} icon={Send} tone="primary" loading={loading} />
        <KpiCard label="Awaiting quotes" value={stats.open} icon={Timer} tone="warning" loading={loading} />
        <KpiCard label="Quotes in" value={stats.quotesIn} icon={GitCompare} tone="info" loading={loading} />
        <KpiCard label="Awarded" value={stats.awarded} icon={Trophy} tone="success" loading={loading} />
      </KpiGrid>

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={reload}
        onRowClick={(rfq) => navigate(`/app/sourcing/quote-comparison?rfq=${rfq.id}`)}
        filters={<FilterBar filters={filterConfig} values={filters} onChange={setFilters} />}
        exportFileName="apparelflow-rfqs"
        searchPlaceholder="Search RFQs…"
        emptyTitle="No RFQs match these filters"
        initialSort={[{ id: 'requiredBy', desc: false }]}
      />
    </div>
  )
}

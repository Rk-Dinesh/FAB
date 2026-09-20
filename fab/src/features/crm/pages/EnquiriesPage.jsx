import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, FileText, Inbox, Target } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader } from '@/components/shared'
import { useAsync } from '@/hooks'
import { enquiryService } from '@/services/crmService'
import { clientService } from '@/services/crmService'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'

const STATUS_TONES = { OPEN: 'info', COSTING: 'warning', CONVERTED: 'success' }

/** CRM → Enquiries: briefs received from brands, and what became of them. */
export function EnquiriesPage() {
  const [filters, setFilters] = useState({})

  const load = useCallback(
    () => enquiryService.list({ filters: filters.status ? { status: filters.status } : {} }),
    [filters],
  )
  const { data, loading, error, reload } = useAsync(load, [filters])
  const enquiries = useMemo(() => data ?? [], [data])

  const clientLoad = useCallback(() => clientService.list(), [])
  const { data: clients } = useAsync(clientLoad)

  const stats = useMemo(() => {
    const open = enquiries.filter((entry) => entry.status !== 'CONVERTED')
    return {
      total: enquiries.length,
      open: open.length,
      units: open.reduce((sum, entry) => sum + entry.quantity, 0),
      value: open.reduce((sum, entry) => sum + entry.quantity * (entry.targetPrice ?? 0), 0),
    }
  }, [enquiries])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'reference',
        header: 'Reference',
        cell: ({ getValue }) => <span className="font-medium text-text">{getValue()}</span>,
      },
      { accessorKey: 'clientName', header: 'Client' },
      { accessorKey: 'styleName', header: 'Style' },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        meta: { align: 'right' },
        cell: ({ getValue }) => `${formatNumber(getValue())} pcs`,
      },
      {
        accessorKey: 'targetPrice',
        header: 'Target FOB',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD', { decimals: 2 }),
      },
      {
        id: 'value',
        accessorFn: (row) => row.quantity * (row.targetPrice ?? 0),
        header: 'Indicative value',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD', { compact: true }),
      },
      {
        accessorKey: 'requiredExFactory',
        header: 'Required ex-factory',
        cell: ({ getValue }) => formatDate(getValue()),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => (
          <Badge tone={STATUS_TONES[getValue()] ?? 'default'} dot>
            {getValue() === 'CONVERTED' ? 'Converted' : getValue() === 'COSTING' ? 'In costing' : 'Open'}
          </Badge>
        ),
      },
      {
        id: 'order',
        header: '',
        enableSorting: false,
        enableHiding: false,
        meta: { align: 'right', width: 110 },
        cell: ({ row }) =>
          row.original.orderId ? (
            <span onClick={(event) => event.stopPropagation()} role="presentation">
              <Button as={Link} to={`/app/orders/${row.original.orderId}`} variant="ghost" size="xs">
                Order <ExternalLink className="size-3" />
              </Button>
            </span>
          ) : null,
      },
    ],
    [],
  )

  const filterConfig = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'OPEN', label: 'Open' },
        { value: 'COSTING', label: 'In costing' },
        { value: 'CONVERTED', label: 'Converted' },
      ],
    },
    {
      key: 'clientId',
      label: 'Client',
      options: (clients ?? []).map((client) => ({ value: client.id, label: client.name })),
    },
  ]

  const filtered = filters.clientId
    ? enquiries.filter((entry) => entry.clientId === filters.clientId)
    : enquiries

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Enquiries"
        description="Briefs received from brands, from first ask through to a live order."
        breadcrumbs={[{ label: 'CRM' }, { label: 'Enquiries' }]}
      />

      <KpiGrid className="mb-5">
        <KpiCard label="Total enquiries" value={stats.total} icon={Inbox} tone="primary" loading={loading} />
        <KpiCard label="Still open" value={stats.open} icon={FileText} tone="warning" loading={loading} />
        <KpiCard
          label="Units enquired"
          value={formatNumber(stats.units)}
          hint="Open enquiries"
          icon={Target}
          tone="info"
          loading={loading}
        />
        <KpiCard
          label="Indicative value"
          value={formatCurrency(stats.value, 'USD', { compact: true })}
          hint="At target prices"
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
        exportFileName="apparelflow-enquiries"
        searchPlaceholder="Search enquiries…"
        emptyTitle="No enquiries match these filters"
        emptyDescription="Enquiries are created from won leads or entered directly by merchandising."
        initialSort={[{ id: 'requiredExFactory', desc: false }]}
      />
    </div>
  )
}

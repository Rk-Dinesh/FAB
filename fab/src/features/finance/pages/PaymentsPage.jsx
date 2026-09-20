import { useCallback, useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Banknote, Scale } from 'lucide-react'
import { Badge } from '@/components/ui'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader } from '@/components/shared'
import { useAsync } from '@/hooks'
import { paymentService } from '@/services/financeService'
import { formatCurrency, formatDate } from '@/utils/format'

/** Finance → Payments: money in from clients and out to vendors. */
export function PaymentsPage() {
  const [filters, setFilters] = useState({})

  const load = useCallback(() => paymentService.list(), [])
  const { data, loading, error, reload } = useAsync(load)
  const payments = useMemo(() => data ?? [], [data])

  const stats = useMemo(() => {
    const received = payments
      .filter((entry) => entry.type === 'RECEIPT')
      .reduce((sum, entry) => sum + entry.amount, 0)
    const paid = payments
      .filter((entry) => entry.type === 'PAYMENT')
      .reduce((sum, entry) => sum + entry.amount, 0)
    return { received, paid, net: received - paid, count: payments.length }
  }, [payments])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'reference',
        header: 'Reference',
        cell: ({ getValue }) => <span className="font-medium text-text">{getValue()}</span>,
      },
      {
        accessorKey: 'type',
        header: 'Direction',
        cell: ({ getValue }) => (
          <Badge tone={getValue() === 'RECEIPT' ? 'success' : 'warning'} size="sm">
            {getValue() === 'RECEIPT' ? (
              <ArrowDownLeft className="size-3" aria-hidden="true" />
            ) : (
              <ArrowUpRight className="size-3" aria-hidden="true" />
            )}
            {getValue() === 'RECEIPT' ? 'Received' : 'Paid'}
          </Badge>
        ),
      },
      { accessorKey: 'partyName', header: 'Party' },
      {
        accessorKey: 'amount',
        header: 'Amount',
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span
            className={
              row.original.type === 'RECEIPT' ? 'font-medium text-success' : 'font-medium text-warning'
            }
          >
            {row.original.type === 'RECEIPT' ? '+' : '−'}
            {formatCurrency(row.original.amount, 'USD')}
          </span>
        ),
      },
      { accessorKey: 'method', header: 'Method' },
      { accessorKey: 'bankReference', header: 'Bank reference' },
      {
        accessorKey: 'paidAt',
        header: 'Date',
        cell: ({ getValue }) => formatDate(getValue()),
      },
    ],
    [],
  )

  const filterConfig = [
    {
      key: 'type',
      label: 'Direction',
      width: 'w-44',
      options: [
        { value: 'RECEIPT', label: 'Received' },
        { value: 'PAYMENT', label: 'Paid' },
      ],
    },
    {
      key: 'method',
      label: 'Method',
      width: 'w-44',
      options: [...new Set(payments.map((entry) => entry.method))].map((method) => ({
        value: method,
        label: method,
      })),
    },
    { key: 'paidAt', label: 'Date', type: 'dateRange' },
  ]

  const filtered = payments.filter((entry) => {
    if (filters.type && entry.type !== filters.type) return false
    if (filters.method && entry.method !== filters.method) return false
    if (filters.paidAt?.from && entry.paidAt < filters.paidAt.from) return false
    if (filters.paidAt?.to && entry.paidAt > filters.paidAt.to) return false
    return true
  })

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Payments"
        description="Receipts from brands and payments out to the supply base."
        breadcrumbs={[{ label: 'Finance' }, { label: 'Payments' }]}
      />

      <KpiGrid className="mb-5">
        <KpiCard
          label="Received"
          value={formatCurrency(stats.received, 'USD', { compact: true })}
          icon={ArrowDownLeft}
          tone="success"
          loading={loading}
        />
        <KpiCard
          label="Paid out"
          value={formatCurrency(stats.paid, 'USD', { compact: true })}
          icon={ArrowUpRight}
          tone="warning"
          loading={loading}
        />
        <KpiCard
          label="Net position"
          value={formatCurrency(stats.net, 'USD', { compact: true })}
          icon={Scale}
          tone={stats.net >= 0 ? 'success' : 'danger'}
          loading={loading}
        />
        <KpiCard label="Transactions" value={stats.count} icon={Banknote} tone="primary" loading={loading} />
      </KpiGrid>

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={reload}
        filters={<FilterBar filters={filterConfig} values={filters} onChange={setFilters} />}
        exportFileName="apparelflow-payments"
        searchPlaceholder="Search payments…"
        emptyTitle="No payments match these filters"
        initialSort={[{ id: 'paidAt', desc: true }]}
      />
    </div>
  )
}

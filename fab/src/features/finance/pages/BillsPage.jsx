import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Receipt, Wallet } from 'lucide-react'
import { cn } from '@/utils/cn'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader, StatusBadge } from '@/components/shared'
import { useAsync } from '@/hooks'
import { billService } from '@/services/financeService'
import { formatCurrency, formatDate } from '@/utils/format'

/** Finance → Bills (AP): what we owe vendors against material POs. */
export function BillsPage() {
  const [filters, setFilters] = useState({})

  const load = useCallback(() => billService.list(), [])
  const { data, loading, error, reload } = useAsync(load)
  const bills = useMemo(() => data ?? [], [data])

  const stats = useMemo(() => {
    const billed = bills.reduce((sum, bill) => sum + bill.amount, 0)
    const paid = bills.reduce((sum, bill) => sum + bill.paidAmount, 0)
    return {
      billed,
      paid,
      outstanding: billed - paid,
      overdue: bills.filter((bill) => bill.status === 'OVERDUE').length,
    }
  }, [bills])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'number',
        header: 'Bill',
        cell: ({ getValue }) => <span className="font-medium text-text">{getValue()}</span>,
      },
      { accessorKey: 'vendorName', header: 'Vendor' },
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
        accessorKey: 'amount',
        header: 'Amount',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD'),
      },
      {
        accessorKey: 'paidAmount',
        header: 'Paid',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD'),
      },
      {
        accessorKey: 'balance',
        header: 'Balance',
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <span className={cn(getValue() > 0 ? 'font-medium text-warning' : 'text-muted')}>
            {formatCurrency(getValue(), 'USD')}
          </span>
        ),
      },
      { accessorKey: 'paymentTermCode', header: 'Terms' },
      {
        accessorKey: 'issuedAt',
        header: 'Issued',
        cell: ({ getValue }) => formatDate(getValue()),
      },
      {
        accessorKey: 'dueAt',
        header: 'Due',
        cell: ({ row }) => (
          <span className={cn(row.original.status === 'OVERDUE' && 'font-medium text-danger')}>
            {formatDate(row.original.dueAt)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge kind="invoice" value={getValue()} />,
      },
    ],
    [],
  )

  const filterConfig = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'SENT', label: 'Open' },
        { value: 'PAID', label: 'Paid' },
        { value: 'OVERDUE', label: 'Overdue' },
      ],
    },
    {
      key: 'vendorName',
      label: 'Vendor',
      width: 'w-56',
      options: [...new Set(bills.map((bill) => bill.vendorName))].map((name) => ({
        value: name,
        label: name,
      })),
    },
  ]

  const filtered = bills.filter(
    (bill) =>
      (!filters.status || bill.status === filters.status) &&
      (!filters.vendorName || bill.vendorName === filters.vendorName),
  )

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Bills"
        description="Payables to mills, trims suppliers and factories against material POs."
        breadcrumbs={[{ label: 'Finance' }, { label: 'Bills' }]}
      />

      <KpiGrid className="mb-5">
        <KpiCard
          label="Billed"
          value={formatCurrency(stats.billed, 'USD', { compact: true })}
          icon={Receipt}
          tone="primary"
          loading={loading}
        />
        <KpiCard
          label="Paid"
          value={formatCurrency(stats.paid, 'USD', { compact: true })}
          tone="success"
          loading={loading}
        />
        <KpiCard
          label="Outstanding"
          value={formatCurrency(stats.outstanding, 'USD', { compact: true })}
          icon={Wallet}
          tone="warning"
          loading={loading}
        />
        <KpiCard
          label="Overdue bills"
          value={stats.overdue}
          icon={AlertTriangle}
          tone="danger"
          loading={loading}
          onClick={() => setFilters({ status: 'OVERDUE' })}
        />
      </KpiGrid>

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={reload}
        filters={<FilterBar filters={filterConfig} values={filters} onChange={setFilters} />}
        exportFileName="apparelflow-bills"
        searchPlaceholder="Search bills…"
        emptyTitle="No bills match these filters"
        initialSort={[{ id: 'dueAt', desc: false }]}
        getRowClassName={(bill) => (bill.status === 'OVERDUE' ? 'bg-danger-soft/25' : '')}
      />
    </div>
  )
}

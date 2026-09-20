import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, Receipt, Tag } from 'lucide-react'
import { Badge } from '@/components/ui'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader } from '@/components/shared'
import { useAsync } from '@/hooks'
import { expenseService } from '@/services/financeService'
import { table } from '@/mocks/db'
import { formatCurrency, formatDate } from '@/utils/format'

const STATUS_TONES = { DRAFT: 'default', SUBMITTED: 'warning', APPROVED: 'success' }

/** Finance → Expenses: overheads and order-attributable costs. */
export function ExpensesPage() {
  const [filters, setFilters] = useState({})

  const load = useCallback(() => expenseService.list(), [])
  const { data, loading, error, reload } = useAsync(load)
  const expenses = useMemo(() => data ?? [], [data])

  const employeesById = useMemo(
    () => Object.fromEntries(table('employees').map((employee) => [employee.id, employee])),
    [],
  )

  const stats = useMemo(
    () => ({
      totalUsd: expenses.reduce((sum, entry) => sum + entry.amountUsd, 0),
      approved: expenses.filter((entry) => entry.status === 'APPROVED').length,
      pending: expenses.filter((entry) => entry.status !== 'APPROVED').length,
      billable: expenses.filter((entry) => entry.billable).reduce((sum, entry) => sum + entry.amountUsd, 0),
    }),
    [expenses],
  )

  const columns = useMemo(
    () => [
      {
        accessorKey: 'reference',
        header: 'Reference',
        cell: ({ getValue }) => <span className="font-medium text-text">{getValue()}</span>,
      },
      { accessorKey: 'head', header: 'Expense head' },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ getValue }) => (
          <Badge tone="outline" size="sm">
            {getValue()}
          </Badge>
        ),
      },
      {
        accessorKey: 'poNumber',
        header: 'Order',
        cell: ({ row }) =>
          row.original.orderId ? (
            <span onClick={(event) => event.stopPropagation()} role="presentation">
              <Link to={`/app/orders/${row.original.orderId}`} className="text-primary hover:underline">
                {row.original.poNumber}
              </Link>
            </span>
          ) : (
            <span className="text-muted">General overhead</span>
          ),
      },
      {
        accessorKey: 'amount',
        header: 'Amount (INR)',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'INR'),
      },
      {
        accessorKey: 'amountUsd',
        header: 'Amount (USD)',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD'),
      },
      {
        accessorKey: 'submittedById',
        header: 'Submitted by',
        meta: { csv: (row) => row.submittedById },
        cell: ({ getValue }) => employeesById[getValue()]?.name ?? getValue(),
      },
      {
        accessorKey: 'incurredAt',
        header: 'Incurred',
        cell: ({ getValue }) => formatDate(getValue()),
      },
      {
        accessorKey: 'billable',
        header: 'Billable',
        cell: ({ getValue }) => (
          <Badge tone={getValue() ? 'info' : 'default'} size="sm" dot>
            {getValue() ? 'Billable' : 'Absorbed'}
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => (
          <Badge tone={STATUS_TONES[getValue()]} dot>
            {getValue().toLowerCase()}
          </Badge>
        ),
      },
    ],
    [employeesById],
  )

  const filterConfig = [
    {
      key: 'category',
      label: 'Category',
      options: [...new Set(expenses.map((entry) => entry.category))].map((category) => ({
        value: category,
        label: category,
      })),
    },
    {
      key: 'status',
      label: 'Status',
      width: 'w-44',
      options: [
        { value: 'DRAFT', label: 'Draft' },
        { value: 'SUBMITTED', label: 'Submitted' },
        { value: 'APPROVED', label: 'Approved' },
      ],
    },
    { key: 'incurredAt', label: 'Incurred', type: 'dateRange' },
  ]

  const filtered = expenses.filter((entry) => {
    if (filters.category && entry.category !== filters.category) return false
    if (filters.status && entry.status !== filters.status) return false
    if (filters.incurredAt?.from && entry.incurredAt < filters.incurredAt.from) return false
    if (filters.incurredAt?.to && entry.incurredAt > filters.incurredAt.to) return false
    return true
  })

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Expenses"
        description="Sampling, travel, testing, customs and office overheads."
        breadcrumbs={[{ label: 'Finance' }, { label: 'Expenses' }]}
      />

      <KpiGrid className="mb-5">
        <KpiCard
          label="Total spend"
          value={formatCurrency(stats.totalUsd, 'USD', { compact: true })}
          icon={Receipt}
          tone="primary"
          loading={loading}
        />
        <KpiCard label="Approved" value={stats.approved} icon={CheckCircle2} tone="success" loading={loading} />
        <KpiCard label="Awaiting approval" value={stats.pending} icon={Clock} tone="warning" loading={loading} />
        <KpiCard
          label="Billable to clients"
          value={formatCurrency(stats.billable, 'USD', { compact: true })}
          icon={Tag}
          tone="info"
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
        exportFileName="apparelflow-expenses"
        searchPlaceholder="Search expenses…"
        emptyTitle="No expenses match these filters"
        initialSort={[{ id: 'incurredAt', desc: true }]}
        dense
      />
    </div>
  )
}

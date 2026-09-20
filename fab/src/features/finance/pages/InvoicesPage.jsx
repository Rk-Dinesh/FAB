import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Banknote, FileText, Wallet } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Card, CardBody, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader, StatusBadge } from '@/components/shared'
import { useAsync } from '@/hooks'
import { getReceivablesAging, invoiceService } from '@/services/financeService'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'

const BUCKET_TONES = {
  current: 'bg-success',
  d1_30: 'bg-warning',
  d31_60: 'bg-warning',
  d61_90: 'bg-danger',
  d90_plus: 'bg-danger',
}

/** Finance → Invoices (AR), with receivables aging. */
export function InvoicesPage() {
  const [filters, setFilters] = useState({})

  const load = useCallback(async () => {
    const [invoices, aging] = await Promise.all([invoiceService.list(), getReceivablesAging()])
    return { invoices, aging }
  }, [])
  const { data, loading, error, reload } = useAsync(load)
  const invoices = useMemo(() => data?.invoices ?? [], [data])
  const aging = data?.aging

  const stats = useMemo(() => {
    const invoiced = invoices.reduce((sum, invoice) => sum + invoice.amount, 0)
    const received = invoices.reduce((sum, invoice) => sum + invoice.receivedAmount, 0)
    return {
      invoiced,
      received,
      outstanding: invoiced - received,
      overdue: invoices.filter((invoice) => invoice.status === 'OVERDUE').length,
    }
  }, [invoices])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'number',
        header: 'Invoice',
        cell: ({ row }) => (
          <span className="flex flex-col leading-tight">
            <span className="font-medium text-text">{row.original.number}</span>
            <span className="text-xs text-muted">{row.original.kind?.toLowerCase() ?? 'commercial'}</span>
          </span>
        ),
      },
      { accessorKey: 'clientName', header: 'Client' },
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
            <span className="text-muted">{row.original.poNumber}</span>
          ),
      },
      {
        accessorKey: 'quantity',
        header: 'Qty',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatNumber(getValue()),
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD'),
      },
      {
        accessorKey: 'receivedAmount',
        header: 'Received',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD'),
      },
      {
        accessorKey: 'balance',
        header: 'Balance',
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <span className={cn(getValue() > 0 ? 'font-medium text-danger' : 'text-muted')}>
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
            {row.original.agingDays > 0 && ` · ${row.original.agingDays}d`}
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
        { value: 'SENT', label: 'Sent' },
        { value: 'PARTIAL', label: 'Part paid' },
        { value: 'PAID', label: 'Paid' },
        { value: 'OVERDUE', label: 'Overdue' },
      ],
    },
    {
      key: 'clientName',
      label: 'Client',
      width: 'w-56',
      options: [...new Set(invoices.map((invoice) => invoice.clientName))].map((name) => ({
        value: name,
        label: name,
      })),
    },
    { key: 'issuedAt', label: 'Issued', type: 'dateRange' },
  ]

  const filtered = invoices.filter((invoice) => {
    if (filters.status && invoice.status !== filters.status) return false
    if (filters.clientName && invoice.clientName !== filters.clientName) return false
    if (filters.issuedAt?.from && invoice.issuedAt < filters.issuedAt.from) return false
    if (filters.issuedAt?.to && invoice.issuedAt > filters.issuedAt.to) return false
    return true
  })

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Invoices"
        description="Receivables from brands — advance invoices against the PO and commercial invoices against the shipment."
        breadcrumbs={[{ label: 'Finance' }, { label: 'Invoices' }]}
      />

      <KpiGrid className="mb-5">
        <KpiCard
          label="Invoiced"
          value={formatCurrency(stats.invoiced, 'USD', { compact: true })}
          icon={FileText}
          tone="primary"
          loading={loading}
        />
        <KpiCard
          label="Received"
          value={formatCurrency(stats.received, 'USD', { compact: true })}
          icon={Banknote}
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
          label="Overdue invoices"
          value={stats.overdue}
          icon={AlertTriangle}
          tone="danger"
          loading={loading}
          onClick={() => setFilters({ status: 'OVERDUE' })}
        />
      </KpiGrid>

      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Receivables aging</CardTitle>
          <CardDescription>
            Open balances by how far past due they are.
          </CardDescription>
        </CardHeader>
        <CardBody>
          {loading || !aging ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-2">
                {aging.buckets.map((bucket) => (
                  <div
                    key={bucket.key}
                    className={BUCKET_TONES[bucket.key]}
                    style={{ width: `${aging.total > 0 ? (bucket.amount / aging.total) * 100 : 0}%` }}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
                {aging.buckets.map((bucket) => (
                  <div key={bucket.key}>
                    <dt className="flex items-center gap-1.5 text-xs text-muted">
                      <span
                        className={cn('size-2 rounded-full', BUCKET_TONES[bucket.key])}
                        aria-hidden="true"
                      />
                      {bucket.label}
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold tabular-nums text-text">
                      {formatCurrency(bucket.amount, 'USD', { compact: true })}
                    </dd>
                    <dd className="text-[11px] text-muted">
                      {bucket.count} invoice{bucket.count === 1 ? '' : 's'} · {bucket.clientCount}{' '}
                      client{bucket.clientCount === 1 ? '' : 's'}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
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
        exportFileName="apparelflow-invoices"
        searchPlaceholder="Search invoices…"
        emptyTitle="No invoices match these filters"
        initialSort={[{ id: 'dueAt', desc: false }]}
        getRowClassName={(invoice) => (invoice.status === 'OVERDUE' ? 'bg-danger-soft/25' : '')}
      />
    </div>
  )
}

import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Percent, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Card, CardBody, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader, StatusBadge } from '@/components/shared'
import { useAsync } from '@/hooks'
import { getOrderPnl } from '@/services/financeService'
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format'

/** Finance → Order P&L: revenue against material, CMT, freight and overhead. */
export function OrderPnlPage() {
  const [filters, setFilters] = useState({})

  const load = useCallback(() => getOrderPnl(), [])
  const { data, loading, error, reload } = useAsync(load)
  const rows = useMemo(() => data ?? [], [data])

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (filters.clientName && row.clientName !== filters.clientName) return false
        if (filters.margin === 'thin' && row.marginPercent >= 12) return false
        if (filters.margin === 'healthy' && row.marginPercent < 12) return false
        if (filters.margin === 'loss' && row.marginPercent >= 0) return false
        return true
      }),
    [rows, filters],
  )

  const stats = useMemo(() => {
    const revenue = filtered.reduce((sum, row) => sum + row.revenue, 0)
    const cost = filtered.reduce((sum, row) => sum + row.cost, 0)
    return {
      revenue,
      cost,
      margin: revenue - cost,
      marginPercent: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0,
      thin: filtered.filter((row) => row.marginPercent < 12).length,
    }
  }, [filtered])

  const chartData = useMemo(
    () =>
      [...filtered]
        .sort((left, right) => right.marginPercent - left.marginPercent)
        .slice(0, 15)
        .map((row) => ({ ...row, label: row.poNumber })),
    [filtered],
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
      { accessorKey: 'styleName', header: 'Style' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge value={getValue()} size="sm" />,
      },
      {
        accessorKey: 'quantity',
        header: 'Qty',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatNumber(getValue()),
      },
      {
        accessorKey: 'revenue',
        header: 'Revenue',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD', { compact: true }),
      },
      {
        accessorKey: 'material',
        header: 'Material',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD', { compact: true }),
      },
      {
        accessorKey: 'cmt',
        header: 'CMT',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD', { compact: true }),
      },
      {
        accessorKey: 'freight',
        header: 'Freight',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD', { compact: true }),
      },
      {
        accessorKey: 'overhead',
        header: 'Overhead',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD', { compact: true }),
      },
      {
        accessorKey: 'grossMargin',
        header: 'Margin',
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <span className={cn(getValue() >= 0 ? 'text-text' : 'font-medium text-danger')}>
            {formatCurrency(getValue(), 'USD', { compact: true })}
          </span>
        ),
      },
      {
        accessorKey: 'marginPercent',
        header: 'Margin %',
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <span
            className={cn(
              'font-medium tabular-nums',
              getValue() < 0
                ? 'text-danger'
                : getValue() < 12
                  ? 'text-warning'
                  : 'text-success',
            )}
          >
            {formatPercent(getValue())}
          </span>
        ),
      },
      {
        accessorKey: 'outstanding',
        header: 'Outstanding',
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <span className={cn(getValue() > 0 && 'text-warning')}>
            {formatCurrency(getValue(), 'USD', { compact: true })}
          </span>
        ),
      },
    ],
    [],
  )

  const filterConfig = [
    {
      key: 'clientName',
      label: 'Client',
      width: 'w-56',
      options: [...new Set(rows.map((row) => row.clientName))].map((name) => ({
        value: name,
        label: name,
      })),
    },
    {
      key: 'margin',
      label: 'Margin',
      width: 'w-48',
      options: [
        { value: 'healthy', label: '12% and above' },
        { value: 'thin', label: 'Below 12%' },
        { value: 'loss', label: 'Loss-making' },
      ],
    },
  ]

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Order P&L"
        description="Revenue against material, CMT, freight and overhead, order by order."
        breadcrumbs={[{ label: 'Finance' }, { label: 'Order P&L' }]}
      />

      <KpiGrid className="mb-5">
        <KpiCard
          label="Revenue"
          value={formatCurrency(stats.revenue, 'USD', { compact: true })}
          icon={TrendingUp}
          tone="primary"
          loading={loading}
        />
        <KpiCard
          label="Cost"
          value={formatCurrency(stats.cost, 'USD', { compact: true })}
          icon={TrendingDown}
          tone="warning"
          loading={loading}
        />
        <KpiCard
          label="Gross margin"
          value={formatCurrency(stats.margin, 'USD', { compact: true })}
          icon={PiggyBank}
          tone={stats.margin >= 0 ? 'success' : 'danger'}
          loading={loading}
        />
        <KpiCard
          label="Blended margin"
          value={formatPercent(stats.marginPercent)}
          hint={stats.thin > 0 ? `${stats.thin} order${stats.thin === 1 ? '' : 's'} under 12%` : 'All above 12%'}
          icon={Percent}
          tone={stats.marginPercent >= 15 ? 'success' : 'warning'}
          loading={loading}
        />
      </KpiGrid>

      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Margin by order</CardTitle>
          <CardDescription>Top 15 orders in the current filter, best margin first.</CardDescription>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : chartData.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">No orders match these filters.</p>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--border)' }}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    height={52}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--surface-2)' }}
                    contentStyle={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                      color: 'var(--text)',
                    }}
                    formatter={(value, _name, item) => [
                      `${formatPercent(value)} · ${formatCurrency(item.payload.grossMargin, 'USD', { compact: true })}`,
                      item.payload.clientName,
                    ]}
                  />
                  <Bar dataKey="marginPercent" radius={[3, 3, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.id}
                        fill={
                          entry.marginPercent < 0
                            ? 'var(--danger)'
                            : entry.marginPercent < 12
                              ? 'var(--warning)'
                              : 'var(--success)'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
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
        exportFileName="apparelflow-order-pnl"
        searchPlaceholder="Search orders…"
        emptyTitle="No orders match these filters"
        initialSort={[{ id: 'marginPercent', desc: false }]}
        dense
      />
    </div>
  )
}

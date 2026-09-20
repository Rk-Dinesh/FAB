import { useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, Banknote, Package, Percent, Truck } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Badge, Card, CardBody, CardHeader, CardTitle, Progress } from '@/components/ui'
import { ErrorState, KpiCard, KpiGrid, PageHeader, StatusBadge } from '@/components/shared'
import { useAsync } from '@/hooks'
import { getExecutiveSummary } from '../dashboardData'
import { ChartCard } from '../components/ChartCard'
import { AXIS_TICK, CHART_COLORS, LEGEND_STYLE, TOOLTIP_STYLE } from '../chartTheme'
import { formatCurrency, formatDate, formatNumber, formatPercent } from '@/utils/format'

/** The CXO home: order book, revenue, margin, on-time and what is going wrong. */
export function ExecutiveDashboard() {
  const load = useCallback(() => getExecutiveSummary(), [])
  const { data, loading, error, reload } = useAsync(load)

  const funnel = useMemo(
    () => (data?.byStatus ?? []).filter((entry) => entry.count > 0),
    [data],
  )

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Executive dashboard"
        description="The order book, revenue against target, margin and where delivery is slipping."
      />

      {error && (
        <Card className="mb-5">
          <ErrorState error={error} onRetry={reload} title="Couldn’t load the dashboard" />
        </Card>
      )}

      <KpiGrid className="mb-5">
        <KpiCard
          label="Order book"
          value={formatCurrency(data?.orderBookValue ?? 0, 'USD', { compact: true })}
          hint={`${formatNumber(data?.orderBookUnits ?? 0)} pcs across ${data?.liveOrders ?? 0} orders`}
          icon={Package}
          tone="primary"
          loading={loading}
        />
        <KpiCard
          label="Revenue YTD"
          value={formatCurrency(data?.revenueYtd ?? 0, 'USD', { compact: true })}
          hint={`${formatCurrency(data?.revenueMtd ?? 0, 'USD', { compact: true })} this month`}
          icon={Banknote}
          tone="success"
          loading={loading}
        />
        <KpiCard
          label="Gross margin"
          value={formatPercent(data?.grossMarginPercent ?? 0)}
          hint="Across costed orders"
          icon={Percent}
          tone={(data?.grossMarginPercent ?? 0) >= 15 ? 'success' : 'warning'}
          loading={loading}
        />
        <KpiCard
          label="On-time delivery"
          value={formatPercent(data?.onTimePercent ?? 0, 0)}
          hint="Shipped orders that hit the original ex-factory date"
          icon={Truck}
          tone={(data?.onTimePercent ?? 0) >= 90 ? 'success' : 'warning'}
          loading={loading}
        />
      </KpiGrid>

      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Revenue vs target"
          description="Trailing twelve months, invoiced value."
          loading={loading}
          className="lg:col-span-2"
          height={260}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data?.monthly ?? []} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: CHART_COLORS.grid }} />
              <YAxis
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value, name) => [formatCurrency(value, 'USD', { compact: true }), name]}
              />
              <Legend wrapperStyle={LEGEND_STYLE} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                fill="url(#revenueFill)"
              />
              <Line
                type="monotone"
                dataKey="target"
                name="Target"
                stroke={CHART_COLORS.muted}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Orders by stage"
          description="The lifecycle funnel across the whole book."
          loading={loading}
          height={260}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnel} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 4 }}>
              <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="label"
                width={104}
                tick={{ ...AXIS_TICK, fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: 'var(--surface-2)' }}
                contentStyle={TOOLTIP_STYLE}
                formatter={(value, _name, item) => [
                  `${value} orders · ${formatCurrency(item.payload.value, 'USD', { compact: true })}`,
                  item.payload.label,
                ]}
              />
              <Bar dataKey="count" radius={[0, 3, 3, 0]} fill={CHART_COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            actions={
              <Link to="/app/crm/clients" className="text-xs font-medium text-primary hover:underline">
                All clients
              </Link>
            }
          >
            <CardTitle>Top clients</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <ul className="divide-y divide-border">
              {(data?.topClients ?? []).slice(0, 6).map((client) => (
                <li key={client.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="truncate text-sm font-medium text-text">{client.name}</span>
                    <span className="text-xs text-muted">
                      {client.country} · {client.orders} orders
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-semibold tabular-nums text-text">
                      {formatCurrency(client.value, 'USD', { compact: true })}
                    </span>
                    {client.outstanding > 0 && (
                      <span className="block text-[11px] text-warning">
                        {formatCurrency(client.outstanding, 'USD', { compact: true })} open
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            actions={
              <Link to="/app/sourcing/vendors" className="text-xs font-medium text-primary hover:underline">
                All vendors
              </Link>
            }
          >
            <CardTitle>Vendor performance</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            {(data?.vendorPerformance ?? []).slice(0, 6).map((vendor) => (
              <div key={vendor.id} className="flex items-center gap-3">
                <span className="w-36 shrink-0 truncate text-sm text-text" title={vendor.name}>
                  {vendor.name}
                </span>
                <Progress
                  value={vendor.onTimePercent}
                  className="flex-1"
                  tone={
                    vendor.onTimePercent >= 90
                      ? 'success'
                      : vendor.onTimePercent >= 82
                        ? 'warning'
                        : 'danger'
                  }
                />
                <span className="w-28 shrink-0 text-right text-xs tabular-nums text-muted">
                  {vendor.onTimePercent}% on time
                  {vendor.delayedStages > 0 && (
                    <span className="ml-1 font-medium text-danger">· {vendor.delayedStages}</span>
                  )}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            actions={
              <Badge tone="danger" size="sm">
                {data?.delayed.length ?? 0} orders
              </Badge>
            }
          >
            <CardTitle>Delayed orders</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {(data?.delayed ?? []).length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">
                Nothing is behind schedule.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {(data?.delayed ?? []).map((order) => (
                  <li key={order.id}>
                    <Link
                      to={`/app/orders/${order.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-surface-2/60"
                    >
                      <span className="flex min-w-0 flex-col leading-tight">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text">{order.poNumber}</span>
                          <StatusBadge value={order.status} size="sm" />
                        </span>
                        <span className="truncate text-xs text-muted">
                          {order.clientName} · {order.styleName}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="flex items-center justify-end gap-1 text-sm font-semibold text-danger">
                          <AlertTriangle className="size-3.5" aria-hidden="true" />
                          {order.delayDays}d
                        </span>
                        <span className="block text-[11px] text-muted">
                          ex-factory {formatDate(order.exFactoryDate, 'dd MMM')}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Receivables</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-2xl font-semibold tabular-nums text-text">
                {formatCurrency(data?.receivables ?? 0, 'USD', { compact: true })}
              </p>
              <p className="mt-1 text-xs text-muted">
                {data?.overdueInvoices ?? 0} invoice{(data?.overdueInvoices ?? 0) === 1 ? '' : 's'}{' '}
                past due
              </p>
              <Link
                to="/app/finance/invoices"
                className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
              >
                Open receivables →
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              actions={
                <span className="text-xs text-muted">{data?.headcountTotal ?? 0} people</span>
              }
            >
              <CardTitle>Headcount</CardTitle>
            </CardHeader>
            <CardBody className="flex flex-col gap-2">
              {(data?.headcount ?? []).slice(0, 6).map((entry) => (
                <div key={entry.department} className="flex items-center gap-2.5">
                  <span className="w-28 shrink-0 truncate text-xs text-muted">
                    {entry.department}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className={cn('h-full rounded-full bg-primary')}
                      style={{
                        width: `${((entry.count / (data?.headcountTotal ?? 1)) * 100).toFixed(0)}%`,
                      }}
                      aria-hidden="true"
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-xs tabular-nums text-text">
                    {entry.count}
                  </span>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

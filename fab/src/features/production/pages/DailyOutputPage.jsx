import { useCallback, useMemo, useState } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Gauge, PackageCheck, Target, XCircle } from 'lucide-react'
import { Card, CardBody, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader } from '@/components/shared'
import { useAsync } from '@/hooks'
import { dailyOutputService, getOutputByDay } from '@/services/productionService'
import { PRODUCTION_STAGES } from '@/config/statuses'
import { table } from '@/mocks/db'
import { formatDate, formatNumber, formatPercent } from '@/utils/format'

// Chart colours are read from the live theme tokens, so both themes work.
const CHART = {
  target: 'var(--text-muted)',
  produced: 'var(--primary)',
  rejected: 'var(--danger)',
  grid: 'var(--border)',
}

/** Production → Daily output: line output per day against target. */
export function DailyOutputPage() {
  const [filters, setFilters] = useState({})

  const load = useCallback(async () => {
    const [rows, byDay] = await Promise.all([dailyOutputService.list(), getOutputByDay()])
    return { rows, byDay }
  }, [])
  const { data, loading, error, reload } = useAsync(load)
  const rows = useMemo(() => data?.rows ?? [], [data])

  const vendorsById = useMemo(
    () => Object.fromEntries(table('vendors').map((vendor) => [vendor.id, vendor])),
    [],
  )

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (filters.vendorId && row.vendorId !== filters.vendorId) return false
        if (filters.stage && row.stage !== filters.stage) return false
        if (filters.date?.from && row.date < filters.date.from) return false
        if (filters.date?.to && row.date > filters.date.to) return false
        return true
      }),
    [rows, filters],
  )

  const chartData = useMemo(() => {
    const byDate = new Map()
    for (const row of filtered) {
      const entry = byDate.get(row.date) ?? { date: row.date, target: 0, produced: 0, rejected: 0 }
      entry.target += row.target
      entry.produced += row.produced
      entry.rejected += row.rejected
      byDate.set(row.date, entry)
    }
    return [...byDate.values()]
      .sort((left, right) => left.date.localeCompare(right.date))
      .slice(-30)
      .map((entry) => ({ ...entry, label: formatDate(entry.date, 'dd MMM') }))
  }, [filtered])

  const stats = useMemo(() => {
    const produced = filtered.reduce((sum, row) => sum + row.produced, 0)
    const target = filtered.reduce((sum, row) => sum + row.target, 0)
    const rejected = filtered.reduce((sum, row) => sum + row.rejected, 0)
    return {
      produced,
      target,
      efficiency: target > 0 ? (produced / target) * 100 : 0,
      rejectRate: produced > 0 ? (rejected / produced) * 100 : 0,
    }
  }, [filtered])

  const columns = useMemo(
    () => [
      { accessorKey: 'date', header: 'Date', cell: ({ getValue }) => formatDate(getValue()) },
      { accessorKey: 'poNumber', header: 'Order' },
      {
        accessorKey: 'vendorId',
        header: 'Factory',
        meta: { csv: (row) => row.vendorId },
        cell: ({ getValue }) => vendorsById[getValue()]?.name ?? getValue(),
      },
      {
        accessorKey: 'stage',
        header: 'Stage',
        cell: ({ getValue }) => PRODUCTION_STAGES[getValue()]?.label ?? getValue(),
      },
      { accessorKey: 'lines', header: 'Lines', meta: { align: 'right' } },
      { accessorKey: 'manpower', header: 'Manpower', meta: { align: 'right' } },
      {
        accessorKey: 'target',
        header: 'Target',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatNumber(getValue()),
      },
      {
        accessorKey: 'produced',
        header: 'Produced',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatNumber(getValue()),
      },
      {
        accessorKey: 'rejected',
        header: 'Rejected',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatNumber(getValue()),
      },
      {
        accessorKey: 'efficiencyPercent',
        header: 'Efficiency',
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <span
            className={
              getValue() >= 95 ? 'font-medium text-success' : getValue() < 80 ? 'font-medium text-danger' : undefined
            }
          >
            {formatPercent(getValue(), 0)}
          </span>
        ),
      },
    ],
    [vendorsById],
  )

  const filterConfig = [
    {
      key: 'vendorId',
      label: 'Factory',
      width: 'w-56',
      options: [...new Set(rows.map((row) => row.vendorId))].map((id) => ({
        value: id,
        label: vendorsById[id]?.name ?? id,
      })),
    },
    {
      key: 'stage',
      label: 'Stage',
      options: [...new Set(rows.map((row) => row.stage))].map((stage) => ({
        value: stage,
        label: PRODUCTION_STAGES[stage]?.label ?? stage,
      })),
    },
    { key: 'date', label: 'Date', type: 'dateRange' },
  ]

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Daily output"
        description="What came off the lines each day against the plan."
        breadcrumbs={[{ label: 'Production' }, { label: 'Daily output' }]}
      />

      <KpiGrid className="mb-5">
        <KpiCard
          label="Produced"
          value={formatNumber(stats.produced)}
          hint="pcs in range"
          icon={PackageCheck}
          tone="primary"
          loading={loading}
        />
        <KpiCard
          label="Target"
          value={formatNumber(stats.target)}
          icon={Target}
          tone="info"
          loading={loading}
        />
        <KpiCard
          label="Efficiency"
          value={formatPercent(stats.efficiency, 0)}
          icon={Gauge}
          tone={stats.efficiency >= 95 ? 'success' : stats.efficiency >= 85 ? 'warning' : 'danger'}
          loading={loading}
        />
        <KpiCard
          label="Reject rate"
          value={formatPercent(stats.rejectRate, 2)}
          icon={XCircle}
          tone={stats.rejectRate < 1.5 ? 'success' : 'danger'}
          loading={loading}
        />
      </KpiGrid>

      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Output against target</CardTitle>
          <CardDescription>Last 30 production days in the current filter.</CardDescription>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : chartData.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">No output recorded in this range.</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={{ stroke: CHART.grid }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatNumber(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                      color: 'var(--text)',
                    }}
                    formatter={(value, name) => [formatNumber(value), name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
                  <Bar dataKey="produced" name="Produced" fill={CHART.produced} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="rejected" name="Rejected" fill={CHART.rejected} radius={[3, 3, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="target"
                    name="Target"
                    stroke={CHART.target}
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
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
        exportFileName="apparelflow-daily-output"
        searchPlaceholder="Search output records…"
        emptyTitle="No output recorded in this range"
        initialSort={[{ id: 'date', desc: true }]}
        dense
      />
    </div>
  )
}

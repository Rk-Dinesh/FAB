import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertOctagon, Bug, CheckCircle2, ScanSearch } from 'lucide-react'
import { Badge, Card, CardBody, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader } from '@/components/shared'
import { useAsync } from '@/hooks'
import { defectService, getDefectPareto } from '@/services/qualityService'
import { table } from '@/mocks/db'
import { formatDate, formatNumber } from '@/utils/format'

const SEVERITY_TONES = { CRITICAL: 'danger', MAJOR: 'warning', MINOR: 'default' }
const SEVERITY_FILLS = {
  CRITICAL: 'var(--danger)',
  MAJOR: 'var(--warning)',
  MINOR: 'var(--text-muted)',
}

/** Quality → Defect log, with a Pareto of what goes wrong most. */
export function DefectsPage() {
  const [filters, setFilters] = useState({})

  const load = useCallback(async () => {
    const [defects, pareto] = await Promise.all([defectService.list(), getDefectPareto()])
    return { defects, pareto }
  }, [])
  const { data, loading, error, reload } = useAsync(load)
  const defects = useMemo(() => data?.defects ?? [], [data])

  const vendorsById = useMemo(
    () => Object.fromEntries(table('vendors').map((vendor) => [vendor.id, vendor])),
    [],
  )

  const filtered = useMemo(
    () =>
      defects.filter(
        (defect) =>
          (!filters.severity || defect.severity === filters.severity) &&
          (!filters.status || defect.status === filters.status) &&
          (!filters.vendorId || defect.vendorId === filters.vendorId),
      ),
    [defects, filters],
  )

  const stats = useMemo(
    () => ({
      total: defects.length,
      units: defects.reduce((sum, defect) => sum + defect.quantity, 0),
      critical: defects.filter((defect) => defect.severity === 'CRITICAL').length,
      open: defects.filter((defect) => defect.status === 'OPEN').length,
    }),
    [defects],
  )

  const paretoData = useMemo(() => {
    const source = data?.pareto ?? []
    // Severity tint comes from whichever severity dominates that defect type.
    const severityByType = new Map()
    for (const defect of defects) {
      const counts = severityByType.get(defect.type) ?? { CRITICAL: 0, MAJOR: 0, MINOR: 0 }
      counts[defect.severity] += defect.quantity
      severityByType.set(defect.type, counts)
    }
    return source.slice(0, 10).map((entry) => {
      const counts = severityByType.get(entry.type) ?? {}
      const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'MINOR'
      return { ...entry, severity: dominant }
    })
  }, [data, defects])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'type',
        header: 'Defect',
        cell: ({ getValue }) => <span className="font-medium text-text">{getValue()}</span>,
      },
      { accessorKey: 'area', header: 'Area' },
      {
        accessorKey: 'severity',
        header: 'Severity',
        cell: ({ getValue }) => (
          <Badge tone={SEVERITY_TONES[getValue()]} dot>
            {getValue().toLowerCase()}
          </Badge>
        ),
      },
      {
        accessorKey: 'quantity',
        header: 'Units',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatNumber(getValue()),
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
        header: 'Factory',
        meta: { csv: (row) => row.vendorId },
        cell: ({ getValue }) => vendorsById[getValue()]?.name ?? getValue(),
      },
      {
        accessorKey: 'stage',
        header: 'Stage',
        cell: ({ getValue }) => (
          <span className="text-xs text-muted">{getValue().replace(/_/g, ' ').toLowerCase()}</span>
        ),
      },
      {
        accessorKey: 'correctiveAction',
        header: 'Corrective action',
        enableSorting: false,
        meta: { width: '24%' },
        cell: ({ getValue }) => <span className="line-clamp-2 text-xs text-muted">{getValue()}</span>,
      },
      {
        accessorKey: 'foundAt',
        header: 'Found',
        cell: ({ getValue }) => formatDate(getValue()),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => (
          <Badge tone={getValue() === 'CLOSED' ? 'success' : 'warning'} dot>
            {getValue().toLowerCase()}
          </Badge>
        ),
      },
    ],
    [vendorsById],
  )

  const filterConfig = [
    {
      key: 'severity',
      label: 'Severity',
      width: 'w-40',
      options: [
        { value: 'CRITICAL', label: 'Critical' },
        { value: 'MAJOR', label: 'Major' },
        { value: 'MINOR', label: 'Minor' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      width: 'w-40',
      options: [
        { value: 'OPEN', label: 'Open' },
        { value: 'CLOSED', label: 'Closed' },
      ],
    },
    {
      key: 'vendorId',
      label: 'Factory',
      width: 'w-56',
      options: [...new Set(defects.map((defect) => defect.vendorId))]
        .filter(Boolean)
        .map((id) => ({ value: id, label: vendorsById[id]?.name ?? id })),
    },
  ]

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Defect log"
        description="Every defect found at inspection, with the corrective action taken."
        breadcrumbs={[{ label: 'Quality' }, { label: 'Defects' }]}
      />

      <KpiGrid className="mb-5">
        <KpiCard label="Defects logged" value={stats.total} icon={Bug} tone="primary" loading={loading} />
        <KpiCard label="Units affected" value={formatNumber(stats.units)} icon={ScanSearch} tone="info" loading={loading} />
        <KpiCard
          label="Critical"
          value={stats.critical}
          icon={AlertOctagon}
          tone="danger"
          loading={loading}
          onClick={() => setFilters({ severity: 'CRITICAL' })}
        />
        <KpiCard
          label="Still open"
          value={stats.open}
          icon={CheckCircle2}
          tone={stats.open === 0 ? 'success' : 'warning'}
          loading={loading}
          onClick={() => setFilters({ status: 'OPEN' })}
        />
      </KpiGrid>

      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Top defect types</CardTitle>
          <CardDescription>
            Units affected, worst first — tinted by the dominant severity for that defect.
          </CardDescription>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : paretoData.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">No defects recorded.</p>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={paretoData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
                >
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="type"
                    width={150}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={false}
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
                      `${formatNumber(value)} units · ${item.payload.occurrences} occurrences`,
                      item.payload.area,
                    ]}
                  />
                  <Bar dataKey="quantity" radius={[0, 3, 3, 0]}>
                    {paretoData.map((entry) => (
                      <Cell key={entry.type} fill={SEVERITY_FILLS[entry.severity]} />
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
        exportFileName="apparelflow-defects"
        searchPlaceholder="Search defects…"
        emptyTitle="No defects match these filters"
        initialSort={[{ id: 'foundAt', desc: true }]}
        dense
      />
    </div>
  )
}

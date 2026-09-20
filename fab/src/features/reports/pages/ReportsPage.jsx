import { useCallback, useMemo, useState } from 'react'
import { BarChart3, Download } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button, Card, CardBody, CardHeader, CardTitle, EmptyState } from '@/components/ui'
import { DataTable, FilterBar, PageHeader } from '@/components/shared'
import { useAsync } from '@/hooks'
import { useCan } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { downloadCsv, toCsv } from '@/utils/csv'
import { reportDefinitions } from '../reportDefinitions'

/**
 * One generic report screen over `reportDefinitions`. The report list itself is
 * filtered by permission, so a role only sees the reports it can run.
 */
export function ReportsPage() {
  const can = useCan()
  const available = useMemo(
    () => reportDefinitions.filter((report) => can(report.module)),
    [can],
  )
  const [selectedId, setSelectedId] = useState(available[0]?.id ?? null)
  const [filters, setFilters] = useState({})

  const report = available.find((entry) => entry.id === selectedId) ?? available[0] ?? null

  const load = useCallback(
    () => (report ? report.load() : Promise.resolve([])),
    [report],
  )
  const { data, loading, error, reload } = useAsync(load, [report?.id], {
    enabled: Boolean(report),
  })
  const rows = useMemo(() => data ?? [], [data])

  /** Apply the report's own filters — same semantics as the service layer. */
  const filtered = useMemo(
    () =>
      rows.filter((row) =>
        Object.entries(filters).every(([key, value]) => {
          if (!value) return true
          if (typeof value === 'object') {
            if (value.from && row[key] < value.from) return false
            if (value.to && row[key] > value.to) return false
            return true
          }
          return String(row[key]) === String(value)
        }),
      ),
    [rows, filters],
  )

  const summary = report?.summary?.(filtered) ?? []

  const exportAll = () => {
    if (!report) return
    const columns = report.columns.map((column) => ({
      key: column.accessorKey ?? column.id,
      label: typeof column.header === 'string' ? column.header : (column.accessorKey ?? column.id),
    }))
    downloadCsv(`apparelflow-${report.id}`, toCsv(filtered, columns))
    toast.success('Report exported', `${filtered.length} rows written to CSV.`)
  }

  if (available.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Reports" breadcrumbs={[{ label: 'Reports' }]} />
        <Card>
          <EmptyState
            icon={BarChart3}
            title="No reports available to your role"
            description="Reports follow the same module permissions as the rest of the app."
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Reports"
        description="Filtered, exportable views across the order book, vendors, quality and finance."
        breadcrumbs={[{ label: 'Reports' }]}
        actions={
          <Button variant="secondary" onClick={exportAll} disabled={filtered.length === 0}>
            <Download className="size-4" /> Export CSV
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Available reports</CardTitle>
          </CardHeader>
          <nav className="p-2">
            {available.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => {
                  setSelectedId(entry.id)
                  setFilters({})
                }}
                className={cn(
                  'flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition-colors',
                  report?.id === entry.id ? 'bg-primary-soft text-primary' : 'hover:bg-surface-2',
                )}
              >
                <span className="text-sm font-medium">{entry.name}</span>
                <span className="text-[11px] leading-snug text-muted">{entry.description}</span>
              </button>
            ))}
          </nav>
        </Card>

        <div className="min-w-0">
          {summary.length > 0 && (
            <Card className="mb-4">
              <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {summary.map((entry) => (
                  <div key={entry.label}>
                    <p className="text-xs text-muted">{entry.label}</p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums text-text">
                      {entry.value}
                    </p>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}

          <DataTable
            data={filtered}
            columns={report.columns}
            loading={loading}
            error={error}
            onRetry={reload}
            filters={
              report.filters ? (
                <FilterBar filters={report.filters} values={filters} onChange={setFilters} />
              ) : undefined
            }
            exportFileName={`apparelflow-${report.id}`}
            searchPlaceholder={`Search ${report.name.toLowerCase()}…`}
            emptyTitle="No rows match these filters"
            emptyDescription={report.description}
            pageSize={25}
            dense
          />
        </div>
      </div>
    </div>
  )
}

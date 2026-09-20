import { useCallback, useMemo, useState } from 'react'
import { Factory, Star, TrendingUp, Users } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Badge, Drawer, Progress } from '@/components/ui'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader } from '@/components/shared'
import { useAsync } from '@/hooks'
import { getVendorPerformance } from '@/services/sourcingService'
import { formatDate, formatPercent } from '@/utils/format'

const TYPE_TONES = { MILL: 'info', TRIMS: 'primary', FACTORY: 'warning', WASHING: 'success' }

/** Star rating that still exports as a number. */
function Rating({ value }) {
  return (
    <span className="inline-flex items-center gap-1" title={`${value} out of 5`}>
      <Star className="size-3.5 fill-warning text-warning" aria-hidden="true" />
      <span className="tabular-nums text-text">{value.toFixed(1)}</span>
    </span>
  )
}

/** Sourcing → Vendors: the approved supplier base with live performance. */
export function VendorsPage() {
  const [filters, setFilters] = useState({})
  const [selected, setSelected] = useState(null)

  const load = useCallback(() => getVendorPerformance(), [])
  const { data, loading, error, reload } = useAsync(load)
  const vendors = useMemo(() => data ?? [], [data])

  const stats = useMemo(() => {
    const active = vendors.filter((vendor) => vendor.active)
    return {
      total: vendors.length,
      active: active.length,
      avgOnTime:
        active.length > 0
          ? active.reduce((sum, vendor) => sum + vendor.onTimePercent, 0) / active.length
          : 0,
      underReview: vendors.filter((vendor) => vendor.onTimePercent < 82).length,
    }
  }, [vendors])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Vendor',
        cell: ({ row }) => (
          <span className="flex flex-col leading-tight">
            <span className="font-medium text-text">{row.original.name}</span>
            <span className="text-xs text-muted">
              {row.original.code} · {row.original.city}
            </span>
          </span>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <Badge tone={TYPE_TONES[row.original.type]} size="sm">
            {row.original.typeLabel}
          </Badge>
        ),
      },
      {
        accessorKey: 'specialities',
        header: 'Specialities',
        enableSorting: false,
        meta: { csv: (row) => row.specialities.join('; ') },
        cell: ({ getValue }) => (
          <span className="line-clamp-1 text-xs text-muted">{getValue().join(', ')}</span>
        ),
      },
      {
        accessorKey: 'rating',
        header: 'Rating',
        meta: { align: 'right', csv: (row) => row.rating },
        cell: ({ getValue }) => <Rating value={getValue()} />,
      },
      {
        accessorKey: 'onTimePercent',
        header: 'On time',
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <span
            className={cn(
              'font-medium tabular-nums',
              getValue() >= 90 ? 'text-success' : getValue() < 82 ? 'text-danger' : 'text-text',
            )}
          >
            {getValue()}%
          </span>
        ),
      },
      {
        accessorKey: 'defectRatePercent',
        header: 'Defect rate',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatPercent(getValue(), 1),
      },
      { accessorKey: 'leadTimeDays', header: 'Lead days', meta: { align: 'right' } },
      { accessorKey: 'activeOrders', header: 'Live orders', meta: { align: 'right' } },
      {
        accessorKey: 'active',
        header: 'Status',
        cell: ({ getValue }) => (
          <Badge tone={getValue() ? 'success' : 'danger'} size="sm" dot>
            {getValue() ? 'Approved' : 'Under review'}
          </Badge>
        ),
      },
    ],
    [],
  )

  const filterConfig = [
    {
      key: 'type',
      label: 'Type',
      options: [
        { value: 'MILL', label: 'Fabric mill' },
        { value: 'TRIMS', label: 'Trims & packaging' },
        { value: 'FACTORY', label: 'Garment factory' },
        { value: 'WASHING', label: 'Washing & embellishment' },
      ],
    },
    {
      key: 'active',
      label: 'Status',
      width: 'w-40',
      options: [
        { value: 'true', label: 'Approved' },
        { value: 'false', label: 'Under review' },
      ],
    },
  ]

  const filtered = vendors.filter(
    (vendor) =>
      (!filters.type || vendor.type === filters.type) &&
      (!filters.active || String(vendor.active) === filters.active),
  )

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Vendors"
        description="Mills, trims suppliers, garment factories and washing units, scored on delivery and quality."
        breadcrumbs={[{ label: 'Sourcing' }, { label: 'Vendors' }]}
      />

      <KpiGrid className="mb-5">
        <KpiCard label="Vendors" value={stats.total} icon={Users} tone="primary" loading={loading} />
        <KpiCard label="Approved" value={stats.active} icon={Factory} tone="success" loading={loading} />
        <KpiCard
          label="Average on-time"
          value={formatPercent(stats.avgOnTime, 0)}
          icon={TrendingUp}
          tone={stats.avgOnTime >= 88 ? 'success' : 'warning'}
          loading={loading}
        />
        <KpiCard
          label="Under review"
          value={stats.underReview}
          hint="Below 82% on-time"
          tone="danger"
          loading={loading}
        />
      </KpiGrid>

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={reload}
        onRowClick={setSelected}
        filters={<FilterBar filters={filterConfig} values={filters} onChange={setFilters} />}
        exportFileName="apparelflow-vendors"
        searchPlaceholder="Search vendors…"
        emptyTitle="No vendors match these filters"
        initialSort={[{ id: 'rating', desc: true }]}
      />

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name}
        description={selected ? `${selected.typeLabel} · ${selected.city}, ${selected.state}` : undefined}
        size="md"
      >
        {selected && (
          <div className="flex flex-col gap-5">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Detail label="Code" value={selected.code} />
              <Detail label="Rating" value={<Rating value={selected.rating} />} />
              <Detail label="Contact" value={selected.contactName} />
              <Detail label="Email" value={selected.email} />
              <Detail label="Monthly capacity" value={selected.monthlyCapacity} />
              <Detail label="Lead time" value={`${selected.leadTimeDays} days`} />
              <Detail label="Payment terms" value={selected.paymentTermCode} />
              <Detail label="Onboarded" value={formatDate(selected.onboardedAt)} />
            </dl>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-text">Performance</h3>
              <div className="flex flex-col gap-3">
                <Progress
                  label="On-time delivery"
                  value={selected.onTimePercent}
                  showValue
                  tone={selected.onTimePercent >= 90 ? 'success' : selected.onTimePercent < 82 ? 'danger' : 'warning'}
                />
                <Progress
                  label="Defect rate (lower is better)"
                  value={selected.defectRatePercent * 10}
                  tone={selected.defectRatePercent < 2 ? 'success' : 'danger'}
                />
                {selected.inspectionPassRate !== null && (
                  <Progress
                    label={`Inspection pass rate (${selected.inspectionCount} inspections)`}
                    value={selected.inspectionPassRate}
                    showValue
                    tone={selected.inspectionPassRate >= 90 ? 'success' : 'warning'}
                  />
                )}
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-text">Specialities</h3>
              <div className="flex flex-wrap gap-1.5">
                {selected.specialities.map((speciality) => (
                  <Badge key={speciality} tone="outline" size="sm">
                    {speciality}
                  </Badge>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-text">Certifications</h3>
              <div className="flex flex-wrap gap-1.5">
                {selected.certifications.map((certification) => (
                  <Badge key={certification} tone="success" size="sm">
                    {certification}
                  </Badge>
                ))}
              </div>
            </section>

            <p className="rounded-lg border border-border bg-surface-2/40 p-3 text-sm text-muted">
              {selected.notes}
            </p>
          </div>
        )}
      </Drawer>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-text">{value}</dd>
    </div>
  )
}

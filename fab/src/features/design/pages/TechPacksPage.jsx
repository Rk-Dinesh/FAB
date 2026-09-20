import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileCheck2, FileStack, Ruler, Send } from 'lucide-react'
import { Badge, Button, Drawer } from '@/components/ui'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader } from '@/components/shared'
import { useAsync } from '@/hooks'
import { useCan } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { techPackService } from '@/services/designService'
import { formatDate, formatNumber } from '@/utils/format'

const STATUS_TONES = { DRAFT: 'default', IN_REVIEW: 'warning', RELEASED: 'success' }

/** Design → Tech packs: the construction spec each order is made against. */
export function TechPacksPage() {
  const can = useCan()
  const [filters, setFilters] = useState({})
  const [selected, setSelected] = useState(null)

  const load = useCallback(() => techPackService.list(), [])
  const { data, loading, error, reload } = useAsync(load)
  const techPacks = useMemo(() => data ?? [], [data])

  const release = async (techPack) => {
    await techPackService.update(techPack.id, {
      status: 'RELEASED',
      releasedAt: new Date().toISOString(),
      version: techPack.version + 1,
    })
    toast.success('Tech pack released', `${techPack.reference} v${techPack.version + 1}`)
    setSelected(null)
    reload()
  }

  const stats = useMemo(
    () => ({
      total: techPacks.length,
      released: techPacks.filter((entry) => entry.status === 'RELEASED').length,
      inReview: techPacks.filter((entry) => entry.status === 'IN_REVIEW').length,
      points: techPacks.reduce((sum, entry) => sum + entry.measurementPoints, 0),
    }),
    [techPacks],
  )

  const columns = useMemo(
    () => [
      {
        accessorKey: 'reference',
        header: 'Tech pack',
        cell: ({ row }) => (
          <span className="flex flex-col leading-tight">
            <span className="font-medium text-text">{row.original.reference}</span>
            <span className="text-xs text-muted">v{row.original.version}</span>
          </span>
        ),
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
      { accessorKey: 'clientName', header: 'Client' },
      { accessorKey: 'styleName', header: 'Style' },
      { accessorKey: 'measurementPoints', header: 'POMs', meta: { align: 'right' } },
      { accessorKey: 'bomLines', header: 'BOM lines', meta: { align: 'right' } },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => (
          <Badge tone={STATUS_TONES[getValue()]} dot>
            {getValue().replace('_', ' ').toLowerCase()}
          </Badge>
        ),
      },
      {
        accessorKey: 'releasedAt',
        header: 'Released',
        cell: ({ getValue }) => (getValue() ? formatDate(getValue()) : <span className="text-muted">—</span>),
      },
    ],
    [],
  )

  const filterConfig = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'DRAFT', label: 'Draft' },
        { value: 'IN_REVIEW', label: 'In review' },
        { value: 'RELEASED', label: 'Released' },
      ],
    },
  ]

  const filtered = filters.status
    ? techPacks.filter((entry) => entry.status === filters.status)
    : techPacks

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Tech packs"
        description="Construction, measurements and bill of materials per style."
        breadcrumbs={[{ label: 'Design' }, { label: 'Tech packs' }]}
      />

      <KpiGrid className="mb-5">
        <KpiCard label="Tech packs" value={stats.total} icon={FileStack} tone="primary" loading={loading} />
        <KpiCard label="Released" value={stats.released} icon={FileCheck2} tone="success" loading={loading} />
        <KpiCard label="In review" value={stats.inReview} icon={Send} tone="warning" loading={loading} />
        <KpiCard
          label="Measurement points"
          value={formatNumber(stats.points)}
          hint="Across all packs"
          icon={Ruler}
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
        onRowClick={setSelected}
        filters={<FilterBar filters={filterConfig} values={filters} onChange={setFilters} />}
        exportFileName="apparelflow-tech-packs"
        searchPlaceholder="Search tech packs…"
        emptyTitle="No tech packs match these filters"
        initialSort={[{ id: 'releasedAt', desc: true }]}
      />

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.reference}
        description={selected ? `${selected.styleName} · ${selected.clientName}` : undefined}
        size="lg"
        footer={
          selected?.status !== 'RELEASED' &&
          can('design', 'approve') && (
            <Button onClick={() => release(selected)}>
              <FileCheck2 className="size-4" /> Release v{(selected?.version ?? 0) + 1}
            </Button>
          )
        }
      >
        {selected && (
          <div className="flex flex-col gap-5">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Detail label="Version" value={`v${selected.version}`} />
              <Detail
                label="Status"
                value={
                  <Badge tone={STATUS_TONES[selected.status]} dot>
                    {selected.status.replace('_', ' ').toLowerCase()}
                  </Badge>
                }
              />
              <Detail label="Measurement points" value={selected.measurementPoints} />
              <Detail label="BOM lines" value={selected.bomLines} />
              <Detail label="Released" value={selected.releasedAt ? formatDate(selected.releasedAt) : 'Not yet'} />
              <Detail label="Last updated" value={formatDate(selected.updatedAt)} />
            </dl>

            <section>
              <h3 className="mb-1.5 text-sm font-semibold text-text">Construction notes</h3>
              <p className="rounded-lg border border-border bg-surface-2/40 p-3 text-sm leading-relaxed text-muted">
                {selected.constructionNotes}
              </p>
            </section>

            <p className="text-xs text-muted">
              In a live system this panel would also carry the flat sketches, the graded
              measurement chart and the artwork files attached to v{selected.version}.
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

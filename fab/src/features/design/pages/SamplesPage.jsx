import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, Shirt, XCircle } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader, StatusBadge } from '@/components/shared'
import { useAsync } from '@/hooks'
import { useCan } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { decideSample, sampleService } from '@/services/designService'
import { recordAudit } from '@/services/adminService'
import { SAMPLE_TYPES } from '@/config/statuses'
import { formatDate } from '@/utils/format'
import { SampleDecisionModal } from '../components/SampleDecisionModal'

/** Design → Samples: proto / fit / size set / PP, with the approval flow. */
export function SamplesPage() {
  const can = useCan()
  const canApprove = can('design', 'approve')
  const [filters, setFilters] = useState({})
  const [pending, setPending] = useState({ sample: null, decision: null })

  const load = useCallback(() => sampleService.list(), [])
  const { data, loading, error, reload } = useAsync(load)
  const samples = useMemo(() => data ?? [], [data])

  const decide = useCallback(
    async (comments) => {
      const { sample, decision } = pending
      await decideSample(sample.id, decision, comments, 'INTERNAL')
      void recordAudit({
        action: decision === 'APPROVED' ? 'SAMPLE_APPROVED' : 'SAMPLE_REJECTED',
        module: 'design',
        entity: sample.reference,
        description: `${decision === 'APPROVED' ? 'Approved' : 'Rejected'} sample ${sample.reference}`,
      })
      toast[decision === 'APPROVED' ? 'success' : 'error'](
        decision === 'APPROVED' ? 'Sample approved' : 'Sample rejected',
        `${sample.reference} · ${sample.styleName}`,
      )
      reload()
    },
    [pending, reload],
  )

  const stats = useMemo(
    () => ({
      total: samples.length,
      pending: samples.filter((sample) => sample.status === 'PENDING').length,
      approved: samples.filter((sample) => sample.status === 'APPROVED').length,
      rejected: samples.filter((sample) => sample.status === 'REJECTED').length,
    }),
    [samples],
  )

  const columns = useMemo(
    () => [
      {
        accessorKey: 'reference',
        header: 'Sample',
        cell: ({ row }) => (
          <span className="flex flex-col leading-tight">
            <span className="font-medium text-text">{row.original.reference}</span>
            <span className="text-xs text-muted">v{row.original.version}</span>
          </span>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ getValue }) => (
          <Badge tone="info" size="sm">
            {SAMPLE_TYPES[getValue()]?.label ?? getValue()}
          </Badge>
        ),
      },
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
      { accessorKey: 'sentAt', header: 'Sent', cell: ({ getValue }) => formatDate(getValue()) },
      {
        accessorKey: 'dueAt',
        header: 'Due',
        cell: ({ row }) => {
          const overdue =
            row.original.status === 'PENDING' && new Date(row.original.dueAt) < new Date()
          return (
            <span className={overdue ? 'font-medium text-danger' : undefined}>
              {formatDate(row.original.dueAt)}
              {overdue && ' · overdue'}
            </span>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Decision',
        cell: ({ getValue }) => <StatusBadge kind="approval" value={getValue()} withIcon />,
      },
      {
        accessorKey: 'comments',
        header: 'Comments',
        enableSorting: false,
        meta: { width: '22%' },
        cell: ({ getValue }) =>
          getValue() ? (
            <span className="line-clamp-2 text-xs text-muted">{getValue()}</span>
          ) : (
            <span className="text-muted">—</span>
          ),
      },
      ...(canApprove
        ? [
            {
              id: 'actions',
              header: '',
              enableSorting: false,
              enableHiding: false,
              meta: { align: 'right', width: 140 },
              cell: ({ row }) =>
                row.original.status === 'PENDING' ? (
                  <span
                    className="flex justify-end gap-1"
                    onClick={(event) => event.stopPropagation()}
                    role="presentation"
                  >
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Approve ${row.original.reference}`}
                      onClick={() => setPending({ sample: row.original, decision: 'APPROVED' })}
                    >
                      <CheckCircle2 className="size-4 text-success" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Reject ${row.original.reference}`}
                      onClick={() => setPending({ sample: row.original, decision: 'REJECTED' })}
                    >
                      <XCircle className="size-4 text-danger" />
                    </Button>
                  </span>
                ) : (
                  <span className="text-xs text-muted">
                    {row.original.decidedAt ? formatDate(row.original.decidedAt, 'dd MMM') : '—'}
                  </span>
                ),
            },
          ]
        : []),
    ],
    [canApprove],
  )

  const filterConfig = [
    {
      key: 'type',
      label: 'Sample type',
      options: Object.entries(SAMPLE_TYPES).map(([value, meta]) => ({ value, label: meta.label })),
    },
    {
      key: 'status',
      label: 'Decision',
      options: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'APPROVED', label: 'Approved' },
        { value: 'REJECTED', label: 'Rejected' },
      ],
    },
  ]

  const filtered = samples.filter(
    (sample) =>
      (!filters.type || sample.type === filters.type) &&
      (!filters.status || sample.status === filters.status),
  )

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Samples"
        description="Proto, fit, size set and PP samples, and what the brand said about each one."
        breadcrumbs={[{ label: 'Design' }, { label: 'Samples' }]}
      />

      <KpiGrid className="mb-5">
        <KpiCard label="Samples" value={stats.total} icon={Shirt} tone="primary" loading={loading} />
        <KpiCard
          label="Awaiting decision"
          value={stats.pending}
          icon={Clock}
          tone="warning"
          loading={loading}
          onClick={() => setFilters({ status: 'PENDING' })}
        />
        <KpiCard label="Approved" value={stats.approved} icon={CheckCircle2} tone="success" loading={loading} />
        <KpiCard
          label="Rejected"
          value={stats.rejected}
          icon={XCircle}
          tone="danger"
          loading={loading}
          hint={stats.total > 0 ? `${((stats.rejected / stats.total) * 100).toFixed(0)}% of submissions` : undefined}
        />
      </KpiGrid>

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={reload}
        filters={<FilterBar filters={filterConfig} values={filters} onChange={setFilters} />}
        exportFileName="apparelflow-samples"
        searchPlaceholder="Search samples…"
        emptyTitle="No samples match these filters"
        emptyDescription="Samples are raised against an order once the tech pack is released."
        initialSort={[{ id: 'sentAt', desc: true }]}
      />

      <SampleDecisionModal
        sample={pending.sample}
        decision={pending.decision}
        onClose={() => setPending({ sample: null, decision: null })}
        onConfirm={decide}
      />
    </div>
  )
}

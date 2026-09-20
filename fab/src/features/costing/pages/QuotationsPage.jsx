import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, FileSignature, History, Send } from 'lucide-react'
import { Badge, Button, Drawer } from '@/components/ui'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader, Timeline } from '@/components/shared'
import { useAsync } from '@/hooks'
import { useCan } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { getQuotationVersions, quotationService } from '@/services/costingService'
import { recordAudit } from '@/services/adminService'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'

const STATUS_TONES = { SENT: 'info', ACCEPTED: 'success', SUPERSEDED: 'default', DECLINED: 'danger' }

/** Costing → Quotations: what was sent to the brand, and every prior version. */
export function QuotationsPage() {
  const can = useCan()
  const [filters, setFilters] = useState({})
  const [selected, setSelected] = useState(null)

  const load = useCallback(() => quotationService.list(), [])
  const { data, loading, error, reload } = useAsync(load)
  const quotations = useMemo(() => data ?? [], [data])

  const accept = async (quotation) => {
    await quotationService.update(quotation.id, { status: 'ACCEPTED' })
    void recordAudit({
      action: 'QUOTATION_ACCEPTED',
      module: 'costing',
      entity: quotation.reference,
      description: `${quotation.clientName} accepted ${quotation.reference} at ${quotation.fobPrice} FOB`,
    })
    toast.success('Quotation accepted', `${quotation.reference} · ${quotation.clientName}`)
    setSelected(null)
    reload()
  }

  const stats = useMemo(() => {
    const live = quotations.filter((entry) => entry.status !== 'SUPERSEDED')
    const accepted = live.filter((entry) => entry.status === 'ACCEPTED')
    return {
      live: live.length,
      sent: live.filter((entry) => entry.status === 'SENT').length,
      accepted: accepted.length,
      value: accepted.reduce((sum, entry) => sum + entry.totalValue, 0),
    }
  }, [quotations])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'reference',
        header: 'Quotation',
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
      {
        accessorKey: 'quantity',
        header: 'Qty',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatNumber(getValue()),
      },
      {
        accessorKey: 'fobPrice',
        header: 'FOB / pc',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD', { decimals: 2 }),
      },
      {
        accessorKey: 'totalValue',
        header: 'Value',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD', { compact: true }),
      },
      { accessorKey: 'incoterm', header: 'Incoterm' },
      { accessorKey: 'paymentTermCode', header: 'Terms' },
      {
        accessorKey: 'sentAt',
        header: 'Sent',
        cell: ({ getValue }) => formatDate(getValue()),
      },
      {
        accessorKey: 'validUntil',
        header: 'Valid until',
        cell: ({ row }) => {
          const expired =
            row.original.status === 'SENT' && new Date(row.original.validUntil) < new Date()
          return (
            <span className={expired ? 'font-medium text-danger' : undefined}>
              {formatDate(row.original.validUntil)}
              {expired && ' · expired'}
            </span>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => (
          <Badge tone={STATUS_TONES[getValue()] ?? 'default'} dot>
            {getValue().toLowerCase()}
          </Badge>
        ),
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
        { value: 'ACCEPTED', label: 'Accepted' },
        { value: 'SUPERSEDED', label: 'Superseded' },
      ],
    },
    {
      key: 'hideSuperseded',
      label: 'Versions',
      options: [
        { value: 'latest', label: 'Latest only' },
        { value: 'all', label: 'All versions' },
      ],
    },
  ]

  const filtered = quotations.filter((entry) => {
    if (filters.status && entry.status !== filters.status) return false
    if (filters.hideSuperseded === 'latest' && entry.status === 'SUPERSEDED') return false
    return true
  })

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Quotations"
        description="Prices sent to brands, with every revision kept."
        breadcrumbs={[{ label: 'Costing' }, { label: 'Quotations' }]}
      />

      <KpiGrid className="mb-5">
        <KpiCard label="Live quotations" value={stats.live} icon={FileSignature} tone="primary" loading={loading} />
        <KpiCard label="Awaiting the client" value={stats.sent} icon={Send} tone="warning" loading={loading} />
        <KpiCard label="Accepted" value={stats.accepted} icon={CheckCircle2} tone="success" loading={loading} />
        <KpiCard
          label="Accepted value"
          value={formatCurrency(stats.value, 'USD', { compact: true })}
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
        exportFileName="apparelflow-quotations"
        searchPlaceholder="Search quotations…"
        emptyTitle="No quotations match these filters"
        initialSort={[{ id: 'sentAt', desc: true }]}
      />

      <QuotationDrawer
        quotation={selected}
        onClose={() => setSelected(null)}
        onAccept={accept}
        canApprove={can('costing', 'approve')}
      />
    </div>
  )
}

function QuotationDrawer({ quotation, onClose, onAccept, canApprove }) {
  const load = useCallback(
    () => (quotation ? getQuotationVersions(quotation.costSheetId) : Promise.resolve([])),
    [quotation],
  )
  const { data: versions, loading } = useAsync(load, [quotation?.costSheetId], {
    enabled: Boolean(quotation),
  })

  return (
    <Drawer
      open={Boolean(quotation)}
      onClose={onClose}
      title={quotation?.reference}
      description={quotation ? `${quotation.styleName} · ${quotation.clientName}` : undefined}
      size="lg"
      footer={
        quotation?.status === 'SENT' &&
        canApprove && (
          <Button onClick={() => onAccept(quotation)}>
            <CheckCircle2 className="size-4" /> Mark as accepted
          </Button>
        )
      }
    >
      {quotation && (
        <div className="flex flex-col gap-6">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Detail label="Version" value={`v${quotation.version}`} />
            <Detail
              label="Status"
              value={
                <Badge tone={STATUS_TONES[quotation.status] ?? 'default'} dot>
                  {quotation.status.toLowerCase()}
                </Badge>
              }
            />
            <Detail label="Quantity" value={`${formatNumber(quotation.quantity)} pcs`} />
            <Detail label="FOB price" value={formatCurrency(quotation.fobPrice, 'USD', { decimals: 2 })} />
            <Detail label="Total value" value={formatCurrency(quotation.totalValue, 'USD')} />
            <Detail label="Incoterm" value={quotation.incoterm} />
            <Detail label="Payment terms" value={quotation.paymentTermCode} />
            <Detail label="Valid until" value={formatDate(quotation.validUntil)} />
          </dl>

          {quotation.notes && (
            <p className="rounded-lg border border-border bg-surface-2/40 p-3 text-sm text-muted">
              {quotation.notes}
            </p>
          )}

          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-text">
              <History className="size-4 text-muted" aria-hidden="true" /> Version history
            </h3>
            {loading ? (
              <p className="text-sm text-muted">Loading versions…</p>
            ) : (
              <Timeline
                relative={false}
                items={(versions ?? []).map((version) => ({
                  id: version.id,
                  title: `v${version.version} — ${formatCurrency(version.fobPrice, 'USD', { decimals: 2 })} FOB`,
                  description: version.notes,
                  at: version.sentAt,
                  tone:
                    version.status === 'ACCEPTED'
                      ? 'success'
                      : version.status === 'SENT'
                        ? 'info'
                        : 'default',
                  meta: (
                    <Badge size="sm" tone={STATUS_TONES[version.status] ?? 'default'}>
                      {version.status.toLowerCase()}
                    </Badge>
                  ),
                }))}
                emptyTitle="No earlier versions"
              />
            )}
          </section>
        </div>
      )}
    </Drawer>
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

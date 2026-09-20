import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Coins, Percent, Table2, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader } from '@/components/shared'
import { useAsync } from '@/hooks'
import { useCan } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { costSheetService } from '@/services/costingService'
import { recordAudit } from '@/services/adminService'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'
import { CostSheetEditor } from '../components/CostSheetEditor'

const STATUS_TONES = { DRAFT: 'default', SENT: 'info', APPROVED: 'success' }

/** Costing → Cost sheets: the FOB build-up behind every quoted price. */
export function CostSheetsPage() {
  const can = useCan()
  const readOnly = !can('costing', 'edit')
  const [filters, setFilters] = useState({})
  const [editing, setEditing] = useState(null)
  const [editorOpen, setEditorOpen] = useState(false)

  const load = useCallback(() => costSheetService.list(), [])
  const { data, loading, error, reload } = useAsync(load)
  const sheets = useMemo(() => data ?? [], [data])

  const open = useCallback((sheet) => {
    setEditing(sheet)
    setEditorOpen(true)
  }, [])

  const save = async (values) => {
    await costSheetService.update(editing.id, { ...values, version: editing.version + 1 })
    void recordAudit({
      action: 'COST_SHEET_UPDATED',
      module: 'costing',
      entity: editing.reference,
      description: `Updated cost sheet ${editing.reference} — FOB ${values.fobPrice} at ${values.marginPercent}%`,
    })
    toast.success('Cost sheet saved', `${editing.reference} v${editing.version + 1}`)
    reload()
  }

  const stats = useMemo(() => {
    const approved = sheets.filter((sheet) => sheet.status === 'APPROVED')
    const avgMargin =
      sheets.length > 0 ? sheets.reduce((sum, sheet) => sum + sheet.marginPercent, 0) / sheets.length : 0
    return {
      total: sheets.length,
      approved: approved.length,
      avgMargin,
      value: approved.reduce((sum, sheet) => sum + sheet.totalValue, 0),
    }
  }, [sheets])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'reference',
        header: 'Cost sheet',
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
        id: 'subtotal',
        accessorKey: 'subtotal',
        header: 'Cost / pc',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD', { decimals: 3 }),
      },
      {
        accessorKey: 'marginPercent',
        header: 'Margin',
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <span
            className={
              getValue() < 12 ? 'font-medium text-danger' : getValue() >= 20 ? 'font-medium text-success' : undefined
            }
          >
            {getValue().toFixed(1)}%
          </span>
        ),
      },
      {
        accessorKey: 'fobPrice',
        header: 'FOB / pc',
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <span className="font-medium">{formatCurrency(getValue(), 'USD', { decimals: 2 })}</span>
        ),
      },
      {
        accessorKey: 'totalValue',
        header: 'Order value',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD', { compact: true }),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => (
          <Badge tone={STATUS_TONES[getValue()]} dot>
            {getValue().toLowerCase()}
          </Badge>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated',
        cell: ({ getValue }) => formatDate(getValue()),
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
        { value: 'SENT', label: 'Sent' },
        { value: 'APPROVED', label: 'Approved' },
      ],
    },
  ]

  const filtered = filters.status ? sheets.filter((sheet) => sheet.status === filters.status) : sheets

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Cost sheets"
        description="Fabric, trims, CM, wash, overhead and freight built up into an FOB price."
        breadcrumbs={[{ label: 'Costing' }, { label: 'Cost sheets' }]}
      />

      <KpiGrid className="mb-5">
        <KpiCard label="Cost sheets" value={stats.total} icon={Table2} tone="primary" loading={loading} />
        <KpiCard label="Approved" value={stats.approved} icon={Coins} tone="success" loading={loading} />
        <KpiCard
          label="Average margin"
          value={`${stats.avgMargin.toFixed(1)}%`}
          icon={Percent}
          tone={stats.avgMargin >= 16 ? 'success' : 'warning'}
          loading={loading}
        />
        <KpiCard
          label="Approved value"
          value={formatCurrency(stats.value, 'USD', { compact: true })}
          icon={TrendingUp}
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
        onRowClick={open}
        filters={<FilterBar filters={filterConfig} values={filters} onChange={setFilters} />}
        exportFileName="apparelflow-cost-sheets"
        searchPlaceholder="Search cost sheets…"
        emptyTitle="No cost sheets match these filters"
        emptyDescription="A cost sheet is opened against an enquiry once the brief is firm."
        initialSort={[{ id: 'updatedAt', desc: true }]}
      />

      <CostSheetEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        sheet={editing}
        onSave={save}
        readOnly={readOnly}
      />
    </div>
  )
}

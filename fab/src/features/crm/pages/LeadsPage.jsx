import { useCallback, useMemo, useState } from 'react'
import { z } from 'zod'
import { ArrowRightLeft, KanbanSquare, List, Plus } from 'lucide-react'
import { Badge, Button, Tabs } from '@/components/ui'
import { DataTable, KpiCard, KpiGrid, PageHeader, RecordDrawer, StatusBadge } from '@/components/shared'
import { useAsync } from '@/hooks'
import { useCan } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { convertLeadToEnquiry, leadService } from '@/services/crmService'
import { LEAD_STAGES } from '@/config/statuses'
import { formatCurrency, formatDate } from '@/utils/format'
import { LeadKanban } from '../components/LeadKanban'

const OWNERS = ['EMP-005', 'EMP-006', 'EMP-007', 'EMP-008', 'EMP-009', 'EMP-010']

const schema = z.object({
  company: z.string().min(1, 'Company is required'),
  contactName: z.string().min(1, 'Contact is required'),
  contactTitle: z.string().optional().or(z.literal('')),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional().or(z.literal('')),
  country: z.string().min(1, 'Country is required'),
  city: z.string().optional().or(z.literal('')),
  segment: z.string().min(1, 'Segment is required'),
  source: z.string().min(1, 'Source is required'),
  stage: z.string().min(1),
  estimatedValueUsd: z.coerce.number().min(0, 'Value cannot be negative'),
  estimatedQuantity: z.coerce.number().int().min(0),
  nextAction: z.string().optional().or(z.literal('')),
  nextActionDate: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

const fields = [
  { name: 'company', label: 'Company', required: true },
  { name: 'segment', label: 'Segment', required: true, placeholder: 'Casual basics' },
  { name: 'contactName', label: 'Contact name', required: true },
  { name: 'contactTitle', label: 'Contact title' },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone' },
  { name: 'country', label: 'Country', required: true },
  { name: 'city', label: 'City' },
  {
    name: 'source',
    label: 'Source',
    type: 'select',
    required: true,
    options: ['Website contact form', 'Trade show — Première Vision', 'Referral', 'LinkedIn outreach', 'Existing client referral', 'Sourcing agent introduction'].map((value) => ({ value, label: value })),
  },
  {
    name: 'stage',
    label: 'Stage',
    type: 'select',
    required: true,
    options: Object.entries(LEAD_STAGES).map(([value, meta]) => ({ value, label: meta.label })),
  },
  { name: 'estimatedValueUsd', label: 'Estimated value (USD)', type: 'number', required: true },
  { name: 'estimatedQuantity', label: 'Estimated quantity (pcs)', type: 'number', required: true },
  { name: 'nextAction', label: 'Next action', full: true },
  { name: 'nextActionDate', label: 'Next action date', type: 'date' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
]

const defaults = {
  company: '', contactName: '', contactTitle: '', email: '', phone: '', country: '', city: '',
  segment: '', source: 'Website contact form', stage: 'NEW', estimatedValueUsd: 100000,
  estimatedQuantity: 10000, nextAction: '', nextActionDate: '', notes: '',
  probability: 10, ownerId: OWNERS[0], convertedEnquiryId: null,
}

/** CRM → Leads: kanban and list over the same pipeline. */
export function LeadsPage() {
  const can = useCan()
  const canEdit = can('crm', 'edit')
  const [view, setView] = useState('kanban')
  const [editing, setEditing] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const load = useCallback(() => leadService.list(), [])
  const { data, loading, error, reload } = useAsync(load)
  const leads = useMemo(() => data ?? [], [data])

  const open = useCallback((lead) => {
    setEditing(lead)
    setDrawerOpen(true)
  }, [])

  const changeStage = async (leadId, stage) => {
    const probability = { NEW: 10, CONTACTED: 25, QUALIFIED: 50, PROPOSAL: 70, WON: 100, LOST: 0 }[stage]
    await leadService.update(leadId, { stage, probability })
    toast.success('Lead moved', `Now in ${LEAD_STAGES[stage].label}.`)
    reload()
  }

  const convert = useCallback(
    async (lead) => {
      const { enquiry } = await convertLeadToEnquiry(lead.id)
      toast.success('Converted to enquiry', `${lead.company} → ${enquiry.reference}`)
      reload()
    },
    [reload],
  )

  const save = async (values) => {
    if (editing) {
      await leadService.update(editing.id, values)
      toast.success('Lead updated')
    } else {
      await leadService.create({ ...defaults, ...values })
      toast.success('Lead created')
    }
    reload()
  }

  const stats = useMemo(() => {
    const openLeads = leads.filter((lead) => !['WON', 'LOST'].includes(lead.stage))
    const won = leads.filter((lead) => lead.stage === 'WON')
    const decided = leads.filter((lead) => ['WON', 'LOST'].includes(lead.stage))
    return {
      open: openLeads.length,
      pipeline: openLeads.reduce((sum, lead) => sum + lead.estimatedValueUsd, 0),
      weighted: openLeads.reduce((sum, lead) => sum + (lead.estimatedValueUsd * lead.probability) / 100, 0),
      winRate: decided.length > 0 ? (won.length / decided.length) * 100 : 0,
    }
  }, [leads])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'company',
        header: 'Company',
        cell: ({ row }) => (
          <span className="flex flex-col leading-tight">
            <span className="font-medium text-text">{row.original.company}</span>
            <span className="text-xs text-muted">{row.original.segment}</span>
          </span>
        ),
      },
      {
        accessorKey: 'contactName',
        header: 'Contact',
        cell: ({ row }) => (
          <span className="flex flex-col leading-tight">
            <span className="text-text">{row.original.contactName}</span>
            <span className="text-xs text-muted">{row.original.email}</span>
          </span>
        ),
      },
      { accessorKey: 'country', header: 'Country' },
      { accessorKey: 'source', header: 'Source' },
      {
        accessorKey: 'stage',
        header: 'Stage',
        cell: ({ getValue }) => <StatusBadge kind="lead" value={getValue()} />,
      },
      {
        accessorKey: 'estimatedValueUsd',
        header: 'Value',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD', { compact: true }),
      },
      {
        accessorKey: 'probability',
        header: 'Prob.',
        meta: { align: 'right' },
        cell: ({ getValue }) => `${getValue()}%`,
      },
      {
        accessorKey: 'nextActionDate',
        header: 'Next action',
        cell: ({ row }) =>
          row.original.nextActionDate ? (
            <span className="flex flex-col leading-tight">
              <span className="text-text">{formatDate(row.original.nextActionDate, 'dd MMM')}</span>
              <span className="max-w-48 truncate text-xs text-muted">{row.original.nextAction}</span>
            </span>
          ) : (
            <span className="text-muted">—</span>
          ),
      },
      ...(canEdit
        ? [
            {
              id: 'actions',
              header: '',
              enableSorting: false,
              enableHiding: false,
              meta: { align: 'right', width: 150 },
              cell: ({ row }) =>
                row.original.convertedEnquiryId ? (
                  <Badge tone="success" size="sm">Converted</Badge>
                ) : (
                  <span onClick={(event) => event.stopPropagation()} role="presentation">
                    <Button variant="secondary" size="xs" onClick={() => convert(row.original)}>
                      <ArrowRightLeft className="size-3.5" /> Convert
                    </Button>
                  </span>
                ),
            },
          ]
        : []),
    ],
    [canEdit, convert],
  )

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Leads"
        description="Brand enquiries before they become orders — drag a card to move it along."
        breadcrumbs={[{ label: 'CRM' }, { label: 'Leads' }]}
        actions={
          can('crm', 'create') && (
            <Button onClick={() => { setEditing(null); setDrawerOpen(true) }}>
              <Plus className="size-4" /> New lead
            </Button>
          )
        }
      />

      <KpiGrid className="mb-5">
        <KpiCard label="Open leads" value={stats.open} tone="primary" loading={loading} />
        <KpiCard
          label="Pipeline value"
          value={formatCurrency(stats.pipeline, 'USD', { compact: true })}
          hint="Open leads only"
          tone="info"
          loading={loading}
        />
        <KpiCard
          label="Weighted pipeline"
          value={formatCurrency(stats.weighted, 'USD', { compact: true })}
          hint="Value × probability"
          tone="success"
          loading={loading}
        />
        <KpiCard
          label="Win rate"
          value={`${stats.winRate.toFixed(0)}%`}
          hint="Won vs decided"
          tone="warning"
          loading={loading}
        />
      </KpiGrid>

      <Tabs
        className="mb-4"
        variant="pill"
        value={view}
        onChange={setView}
        tabs={[
          { value: 'kanban', label: 'Board', icon: KanbanSquare },
          { value: 'list', label: 'List', icon: List, count: leads.length },
        ]}
      />

      {view === 'kanban' ? (
        loading ? (
          <div className="flex gap-3 overflow-hidden">
            {Object.keys(LEAD_STAGES).map((stage) => (
              <div key={stage} className="h-64 w-72 shrink-0 animate-pulse rounded-lg bg-surface-2" />
            ))}
          </div>
        ) : (
          <LeadKanban leads={leads} onStageChange={changeStage} onOpen={open} canEdit={canEdit} />
        )
      ) : (
        <DataTable
          data={leads}
          columns={columns}
          loading={loading}
          error={error}
          onRetry={reload}
          onRowClick={open}
          exportFileName="apparelflow-leads"
          searchPlaceholder="Search leads…"
          emptyTitle="No leads yet"
          emptyDescription="Leads arrive from the website contact form or are added by the team."
        />
      )}

      <RecordDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? 'Edit lead' : 'New lead'}
        description={editing?.company}
        schema={schema}
        fields={fields}
        defaultValues={editing ? { ...defaults, ...editing } : defaults}
        onSubmit={save}
        submitLabel={editing ? 'Save changes' : 'Create lead'}
        size="lg"
      />
    </div>
  )
}

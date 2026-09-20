import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { CheckCheck, Mail, MessageSquare, Plus, Send } from 'lucide-react'
import { Badge } from '@/components/ui'
import { Button } from '@/components/ui'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader, RecordDrawer } from '@/components/shared'
import { useAsync } from '@/hooks'
import { useCan } from '@/store/authStore'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { clientUpdateService, sendClientUpdate } from '@/services/clientUpdateService'
import { table } from '@/mocks/db'
import { formatDate, formatRelative } from '@/utils/format'

const AREAS = ['Sampling', 'Sourcing', 'Production', 'Quality', 'Logistics', 'Finance']
const AREA_TONES = {
  Sampling: 'info',
  Sourcing: 'warning',
  Production: 'primary',
  Quality: 'success',
  Logistics: 'info',
  Finance: 'default',
}

const schema = z.object({
  orderId: z.string().min(1, 'Pick an order'),
  area: z.string().min(1, 'Pick an area'),
  subject: z.string().min(4, 'Give the update a subject'),
  body: z.string().min(10, 'Say something the client can act on'),
  channel: z.enum(['EMAIL', 'PORTAL']),
})

/** Client updates: what each brand has actually been told, and by whom. */
export function ClientUpdatesPage() {
  const can = useCan()
  const currentUser = useAuthStore((state) => state.user)
  const [filters, setFilters] = useState({})
  const [drawerOpen, setDrawerOpen] = useState(false)

  const load = useCallback(() => clientUpdateService.list(), [])
  const { data, loading, error, reload } = useAsync(load)
  const updates = useMemo(() => data ?? [], [data])

  const orders = useMemo(() => table('orders').filter((order) => order.statusIndex >= 5), [])
  const employeesById = useMemo(
    () => Object.fromEntries(table('employees').map((employee) => [employee.id, employee])),
    [],
  )

  const stats = useMemo(
    () => ({
      total: updates.length,
      acknowledged: updates.filter((entry) => entry.acknowledged).length,
      portal: updates.filter((entry) => entry.channel === 'PORTAL').length,
      clients: new Set(updates.map((entry) => entry.clientId)).size,
    }),
    [updates],
  )

  const save = async (values) => {
    const order = orders.find((entry) => entry.id === values.orderId)
    await sendClientUpdate({
      orderId: order.id,
      poNumber: order.poNumber,
      clientId: order.clientId,
      clientName: order.clientName,
      area: values.area,
      subject: values.subject,
      body: values.body,
      channel: values.channel,
      sentById: currentUser?.employeeId ?? order.merchandiserId,
    })
    toast.success('Update sent', `${order.clientName} · ${order.poNumber}`)
    reload()
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'sentAt',
        header: 'Sent',
        cell: ({ getValue }) => (
          <span className="flex flex-col leading-tight">
            <span className="text-text">{formatDate(getValue(), 'dd MMM, HH:mm')}</span>
            <span className="text-xs text-muted">{formatRelative(getValue())}</span>
          </span>
        ),
      },
      { accessorKey: 'clientName', header: 'Client' },
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
        accessorKey: 'area',
        header: 'Area',
        cell: ({ getValue }) => (
          <Badge tone={AREA_TONES[getValue()] ?? 'default'} size="sm">
            {getValue()}
          </Badge>
        ),
      },
      {
        accessorKey: 'subject',
        header: 'Update',
        meta: { width: '32%' },
        cell: ({ row }) => (
          <span className="flex flex-col leading-tight">
            <span className="font-medium text-text">{row.original.subject}</span>
            <span className="line-clamp-2 text-xs text-muted">{row.original.body}</span>
          </span>
        ),
      },
      {
        accessorKey: 'channel',
        header: 'Channel',
        cell: ({ getValue }) => (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            {getValue() === 'EMAIL' ? (
              <Mail className="size-3.5" aria-hidden="true" />
            ) : (
              <MessageSquare className="size-3.5" aria-hidden="true" />
            )}
            {getValue().toLowerCase()}
          </span>
        ),
      },
      {
        accessorKey: 'sentById',
        header: 'Sent by',
        meta: { csv: (row) => row.sentById },
        cell: ({ getValue }) => employeesById[getValue()]?.name ?? getValue(),
      },
      {
        accessorKey: 'acknowledged',
        header: 'Acknowledged',
        cell: ({ getValue }) => (
          <Badge tone={getValue() ? 'success' : 'default'} size="sm" dot>
            {getValue() ? 'Yes' : 'Awaiting'}
          </Badge>
        ),
      },
    ],
    [employeesById],
  )

  const filterConfig = [
    {
      key: 'clientName',
      label: 'Client',
      width: 'w-56',
      options: [...new Set(updates.map((entry) => entry.clientName))].map((name) => ({
        value: name,
        label: name,
      })),
    },
    { key: 'area', label: 'Area', options: AREAS.map((area) => ({ value: area, label: area })) },
    {
      key: 'channel',
      label: 'Channel',
      width: 'w-40',
      options: [
        { value: 'EMAIL', label: 'Email' },
        { value: 'PORTAL', label: 'Portal' },
      ],
    },
  ]

  const filtered = updates.filter((entry) =>
    Object.entries(filters).every(([key, value]) => !value || entry[key] === value),
  )

  const fields = [
    {
      name: 'orderId',
      label: 'Order',
      type: 'select',
      required: true,
      full: true,
      options: orders.map((order) => ({
        value: order.id,
        label: `${order.poNumber} — ${order.clientName} · ${order.styleName}`,
      })),
    },
    { name: 'area', label: 'Area', type: 'select', required: true, options: AREAS.map((area) => ({ value: area, label: area })) },
    {
      name: 'channel',
      label: 'Channel',
      type: 'select',
      required: true,
      options: [
        { value: 'EMAIL', label: 'Email' },
        { value: 'PORTAL', label: 'Client portal' },
      ],
    },
    { name: 'subject', label: 'Subject', required: true, full: true },
    { name: 'body', label: 'Message', type: 'textarea', required: true },
  ]

  const defaults = {
    orderId: orders[0]?.id ?? '',
    area: 'Production',
    channel: 'EMAIL',
    subject: '',
    body: '',
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Client updates"
        description="Every progress note sent to a brand, by order and by area."
        breadcrumbs={[{ label: 'Client updates' }]}
        actions={
          can('clientUpdates', 'create') && (
            <Button onClick={() => setDrawerOpen(true)}>
              <Plus className="size-4" /> Send an update
            </Button>
          )
        }
      />

      <KpiGrid className="mb-5">
        <KpiCard label="Updates sent" value={stats.total} icon={Send} tone="primary" loading={loading} />
        <KpiCard
          label="Acknowledged"
          value={stats.acknowledged}
          hint={stats.total > 0 ? `${((stats.acknowledged / stats.total) * 100).toFixed(0)}% of updates` : undefined}
          icon={CheckCheck}
          tone="success"
          loading={loading}
        />
        <KpiCard label="Via the portal" value={stats.portal} icon={MessageSquare} tone="info" loading={loading} />
        <KpiCard label="Clients reached" value={stats.clients} tone="warning" loading={loading} />
      </KpiGrid>

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={reload}
        filters={<FilterBar filters={filterConfig} values={filters} onChange={setFilters} />}
        exportFileName="apparelflow-client-updates"
        searchPlaceholder="Search updates…"
        emptyTitle="No updates match these filters"
        initialSort={[{ id: 'sentAt', desc: true }]}
      />

      <RecordDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Send a client update"
        description="Goes to the brand by email or appears in their portal."
        schema={schema}
        fields={fields}
        defaultValues={defaults}
        onSubmit={save}
        submitLabel="Send update"
        size="lg"
      />
    </div>
  )
}

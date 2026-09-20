import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleDot, PencilRuler, Plus, Timer } from 'lucide-react'
import { z } from 'zod'
import { Badge } from '@/components/ui'
import { Button } from '@/components/ui'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader, RecordDrawer } from '@/components/shared'
import { useAsync } from '@/hooks'
import { useCan } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { designRequestService } from '@/services/designService'
import { employeeService } from '@/services/hrService'
import { orderService } from '@/services/orderService'
import { formatDate } from '@/utils/format'

const PRIORITY_TONES = { HIGH: 'danger', NORMAL: 'info', LOW: 'default' }
const STATUS_TONES = { OPEN: 'warning', IN_PROGRESS: 'primary', COMPLETED: 'success' }

const BASE_DEFAULTS = {
  orderId: '',
  brief: '',
  assignedToId: 'EMP-012',
  priority: 'NORMAL',
  dueDate: '',
  status: 'OPEN',
}

/** @param {number} days @returns {string} YYYY-MM-DD */
function inDays(days) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
}

const schema = z.object({
  orderId: z.string().min(1, 'Pick an order'),
  brief: z.string().min(10, 'Give the designer something to work from'),
  assignedToId: z.string().min(1, 'Assign a designer'),
  priority: z.enum(['HIGH', 'NORMAL', 'LOW']),
  dueDate: z.string().min(1, 'A due date is required'),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED']),
})

/** Design → Requests: briefs from merchandising to the design team. */
export function DesignRequestsPage() {
  const can = useCan()
  const [filters, setFilters] = useState({})
  const [editing, setEditing] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [createDefaults, setCreateDefaults] = useState(BASE_DEFAULTS)

  const load = useCallback(async () => {
    const [requests, designers, orders] = await Promise.all([
      designRequestService.list(),
      employeeService.list({ filters: { department: 'Design' } }),
      orderService.list(),
    ])
    return { requests, designers, orders }
  }, [])
  const { data, loading, error, reload } = useAsync(load)
  const requests = useMemo(() => data?.requests ?? [], [data])

  const open = useCallback((row) => {
    setEditing(row)
    setDrawerOpen(true)
  }, [])

  const save = async (values) => {
    const order = data.orders.find((entry) => entry.id === values.orderId)
    const payload = {
      ...values,
      poNumber: order?.poNumber,
      clientId: order?.clientId,
      clientName: order?.clientName,
      styleName: order?.styleName,
      categoryId: order?.categoryId,
    }
    if (editing) {
      await designRequestService.update(editing.id, payload)
      toast.success('Design request updated')
    } else {
      await designRequestService.create({
        reference: `DR-${1400 + requests.length}`,
        requestedById: 'EMP-005',
        raisedAt: new Date().toISOString(),
        ...payload,
      })
      toast.success('Design request raised')
    }
    reload()
  }

  const stats = useMemo(
    () => ({
      total: requests.length,
      open: requests.filter((entry) => entry.status === 'OPEN').length,
      inProgress: requests.filter((entry) => entry.status === 'IN_PROGRESS').length,
      overdue: requests.filter(
        (entry) => entry.status !== 'COMPLETED' && new Date(entry.dueDate) < new Date(),
      ).length,
    }),
    [requests],
  )

  const designerName = useCallback(
    (id) => data?.designers.find((entry) => entry.id === id)?.name ?? id,
    [data],
  )

  const columns = useMemo(
    () => [
      {
        accessorKey: 'reference',
        header: 'Request',
        cell: ({ getValue }) => <span className="font-medium text-text">{getValue()}</span>,
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
        accessorKey: 'assignedToId',
        header: 'Designer',
        meta: { csv: (row) => row.assignedToId },
        cell: ({ getValue }) => designerName(getValue()),
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ getValue }) => (
          <Badge tone={PRIORITY_TONES[getValue()]} size="sm" dot>
            {getValue().toLowerCase()}
          </Badge>
        ),
      },
      {
        accessorKey: 'dueDate',
        header: 'Due',
        cell: ({ row }) => {
          const late = row.original.status !== 'COMPLETED' && new Date(row.original.dueDate) < new Date()
          return (
            <span className={late ? 'font-medium text-danger' : undefined}>
              {formatDate(row.original.dueDate)}
            </span>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => (
          <Badge tone={STATUS_TONES[getValue()]} dot>
            {getValue().replace('_', ' ').toLowerCase()}
          </Badge>
        ),
      },
    ],
    [designerName],
  )

  const filterConfig = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'OPEN', label: 'Open' },
        { value: 'IN_PROGRESS', label: 'In progress' },
        { value: 'COMPLETED', label: 'Completed' },
      ],
    },
    {
      key: 'priority',
      label: 'Priority',
      options: [
        { value: 'HIGH', label: 'High' },
        { value: 'NORMAL', label: 'Normal' },
        { value: 'LOW', label: 'Low' },
      ],
    },
    {
      key: 'assignedToId',
      label: 'Designer',
      options: (data?.designers ?? []).map((entry) => ({ value: entry.id, label: entry.name })),
    },
  ]

  const filtered = requests.filter((entry) =>
    Object.entries(filters).every(([key, value]) => !value || entry[key] === value),
  )

  const fields = [
    {
      name: 'orderId',
      label: 'Order',
      type: 'select',
      required: true,
      full: true,
      options: (data?.orders ?? []).map((order) => ({
        value: order.id,
        label: `${order.poNumber} — ${order.clientName} · ${order.styleName}`,
      })),
    },
    { name: 'brief', label: 'Brief', type: 'textarea', required: true },
    {
      name: 'assignedToId',
      label: 'Designer',
      type: 'select',
      required: true,
      options: (data?.designers ?? []).map((entry) => ({ value: entry.id, label: entry.name })),
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'select',
      required: true,
      options: [
        { value: 'HIGH', label: 'High' },
        { value: 'NORMAL', label: 'Normal' },
        { value: 'LOW', label: 'Low' },
      ],
    },
    { name: 'dueDate', label: 'Due date', type: 'date', required: true },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'OPEN', label: 'Open' },
        { value: 'IN_PROGRESS', label: 'In progress' },
        { value: 'COMPLETED', label: 'Completed' },
      ],
    },
  ]

  // Built in the click handler so no impure clock read happens during render.
  const openCreate = () => {
    setCreateDefaults({ ...BASE_DEFAULTS, dueDate: inDays(14) })
    setEditing(null)
    setDrawerOpen(true)
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Design requests"
        description="What merchandising has asked the design team to develop."
        breadcrumbs={[{ label: 'Design' }, { label: 'Requests' }]}
        actions={
          can('design', 'create') && (
            <Button onClick={openCreate}>
              <Plus className="size-4" /> New request
            </Button>
          )
        }
      />

      <KpiGrid className="mb-5">
        <KpiCard label="Requests" value={stats.total} icon={PencilRuler} tone="primary" loading={loading} />
        <KpiCard label="Open" value={stats.open} icon={CircleDot} tone="warning" loading={loading} />
        <KpiCard label="In progress" value={stats.inProgress} icon={Timer} tone="info" loading={loading} />
        <KpiCard label="Past due" value={stats.overdue} icon={Timer} tone="danger" loading={loading} />
      </KpiGrid>

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={reload}
        onRowClick={can('design', 'edit') ? open : undefined}
        filters={<FilterBar filters={filterConfig} values={filters} onChange={setFilters} />}
        exportFileName="apparelflow-design-requests"
        searchPlaceholder="Search design requests…"
        emptyTitle="No design requests match these filters"
        initialSort={[{ id: 'dueDate', desc: false }]}
      />

      <RecordDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? 'Edit design request' : 'New design request'}
        description={editing?.reference}
        schema={schema}
        fields={fields}
        defaultValues={editing ? { ...BASE_DEFAULTS, ...editing } : createDefaults}
        onSubmit={save}
        submitLabel={editing ? 'Save changes' : 'Raise request'}
        size="lg"
      />
    </div>
  )
}

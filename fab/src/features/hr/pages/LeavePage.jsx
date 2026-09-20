import { useCallback, useMemo, useState } from 'react'
import { z } from 'zod'
import { CalendarPlus, Check, Clock, X } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader, RecordDrawer } from '@/components/shared'
import { useAsync } from '@/hooks'
import { useAuthStore, useCan } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { decideLeave, employeeService, leaveService } from '@/services/hrService'
import { formatDate } from '@/utils/format'

const TYPES = [
  { value: 'CASUAL', label: 'Casual' },
  { value: 'SICK', label: 'Sick' },
  { value: 'EARNED', label: 'Earned' },
  { value: 'UNPAID', label: 'Unpaid' },
]
const STATUS_TONES = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' }

const schema = z
  .object({
    employeeId: z.string().min(1, 'Pick an employee'),
    type: z.enum(['CASUAL', 'SICK', 'EARNED', 'UNPAID']),
    fromDate: z.string().min(1, 'A start date is required'),
    toDate: z.string().min(1, 'An end date is required'),
    reason: z.string().min(4, 'Give a reason'),
  })
  .refine((values) => values.toDate >= values.fromDate, {
    message: 'The end date cannot be before the start date',
    path: ['toDate'],
  })

/** HR → Leave: apply on behalf of an employee, and approve or reject requests. */
export function LeavePage() {
  const can = useCan()
  const currentUser = useAuthStore((state) => state.user)
  const canApprove = can('hr', 'approve')
  const [filters, setFilters] = useState({})
  const [drawerOpen, setDrawerOpen] = useState(false)

  const load = useCallback(async () => {
    const [leaves, employees] = await Promise.all([leaveService.list(), employeeService.list()])
    return { leaves, employees }
  }, [])
  const { data, loading, error, reload } = useAsync(load)
  const leaves = useMemo(() => data?.leaves ?? [], [data])

  const decide = useCallback(
    async (leave, status) => {
      await decideLeave(
        leave.id,
        status,
        status === 'REJECTED' ? 'Cover could not be arranged for those dates.' : '',
        currentUser?.employeeId ?? 'EMP-042',
      )
      toast[status === 'APPROVED' ? 'success' : 'error'](
        status === 'APPROVED' ? 'Leave approved' : 'Leave rejected',
        `${leave.employeeName} · ${leave.days} day${leave.days === 1 ? '' : 's'}`,
      )
      reload()
    },
    [currentUser, reload],
  )

  const apply = async (values) => {
    const employee = data.employees.find((entry) => entry.id === values.employeeId)
    const days =
      Math.round(
        (new Date(`${values.toDate}T00:00:00.000Z`).getTime() -
          new Date(`${values.fromDate}T00:00:00.000Z`).getTime()) /
          86400000,
      ) + 1
    await leaveService.create({
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department,
      type: values.type,
      fromDate: values.fromDate,
      toDate: values.toDate,
      days,
      reason: values.reason,
      status: 'PENDING',
      appliedAt: new Date().toISOString(),
      decidedById: null,
      decidedAt: null,
      remarks: 'Awaiting the reporting manager.',
    })
    toast.success('Leave applied', `${employee.name} · ${days} day${days === 1 ? '' : 's'}`)
    reload()
  }

  const stats = useMemo(
    () => ({
      pending: leaves.filter((entry) => entry.status === 'PENDING').length,
      approved: leaves.filter((entry) => entry.status === 'APPROVED').length,
      rejected: leaves.filter((entry) => entry.status === 'REJECTED').length,
      days: leaves
        .filter((entry) => entry.status === 'APPROVED')
        .reduce((sum, entry) => sum + entry.days, 0),
    }),
    [leaves],
  )

  const columns = useMemo(
    () => [
      { accessorKey: 'employeeName', header: 'Employee' },
      { accessorKey: 'department', header: 'Department' },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ getValue }) => (
          <Badge tone="outline" size="sm">
            {getValue().toLowerCase()}
          </Badge>
        ),
      },
      {
        id: 'dates',
        accessorFn: (row) => row.fromDate,
        header: 'Dates',
        cell: ({ row }) =>
          `${formatDate(row.original.fromDate, 'dd MMM')} – ${formatDate(row.original.toDate, 'dd MMM')}`,
      },
      { accessorKey: 'days', header: 'Days', meta: { align: 'right' } },
      {
        accessorKey: 'reason',
        header: 'Reason',
        meta: { width: '22%' },
        cell: ({ getValue }) => <span className="text-xs text-muted">{getValue()}</span>,
      },
      {
        accessorKey: 'appliedAt',
        header: 'Applied',
        cell: ({ getValue }) => formatDate(getValue()),
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
      ...(canApprove
        ? [
            {
              id: 'actions',
              header: '',
              enableSorting: false,
              enableHiding: false,
              meta: { align: 'right', width: 120 },
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
                      aria-label={`Approve leave for ${row.original.employeeName}`}
                      onClick={() => decide(row.original, 'APPROVED')}
                    >
                      <Check className="size-4 text-success" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Reject leave for ${row.original.employeeName}`}
                      onClick={() => decide(row.original, 'REJECTED')}
                    >
                      <X className="size-4 text-danger" />
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
    [canApprove, decide],
  )

  const filterConfig = [
    {
      key: 'status',
      label: 'Status',
      width: 'w-44',
      options: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'APPROVED', label: 'Approved' },
        { value: 'REJECTED', label: 'Rejected' },
      ],
    },
    { key: 'type', label: 'Type', width: 'w-40', options: TYPES },
    {
      key: 'department',
      label: 'Department',
      width: 'w-52',
      options: [...new Set(leaves.map((entry) => entry.department))].map((name) => ({
        value: name,
        label: name,
      })),
    },
  ]

  const filtered = leaves.filter((entry) =>
    Object.entries(filters).every(([key, value]) => !value || entry[key] === value),
  )

  const fields = [
    {
      name: 'employeeId',
      label: 'Employee',
      type: 'select',
      required: true,
      full: true,
      options: (data?.employees ?? []).map((employee) => ({
        value: employee.id,
        label: `${employee.name} — ${employee.department} (${employee.leaveBalance} days left)`,
      })),
    },
    { name: 'type', label: 'Leave type', type: 'select', required: true, options: TYPES },
    { name: 'fromDate', label: 'From', type: 'date', required: true },
    { name: 'toDate', label: 'To', type: 'date', required: true },
    { name: 'reason', label: 'Reason', type: 'textarea', required: true },
  ]

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Leave"
        description="Applications and approvals across the team."
        breadcrumbs={[{ label: 'HR' }, { label: 'Leave' }]}
        actions={
          can('hr', 'create') && (
            <Button onClick={() => setDrawerOpen(true)}>
              <CalendarPlus className="size-4" /> Apply for leave
            </Button>
          )
        }
      />

      <KpiGrid className="mb-5">
        <KpiCard
          label="Awaiting approval"
          value={stats.pending}
          icon={Clock}
          tone="warning"
          loading={loading}
          onClick={() => setFilters({ status: 'PENDING' })}
        />
        <KpiCard label="Approved" value={stats.approved} icon={Check} tone="success" loading={loading} />
        <KpiCard label="Rejected" value={stats.rejected} icon={X} tone="danger" loading={loading} />
        <KpiCard label="Approved days" value={stats.days} tone="info" loading={loading} />
      </KpiGrid>

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={reload}
        filters={<FilterBar filters={filterConfig} values={filters} onChange={setFilters} />}
        exportFileName="apparelflow-leave"
        searchPlaceholder="Search leave requests…"
        emptyTitle="No leave requests match these filters"
        initialSort={[{ id: 'appliedAt', desc: true }]}
      />

      <RecordDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Apply for leave"
        description="Raised as pending until the reporting manager decides."
        schema={schema}
        fields={fields}
        defaultValues={{
          employeeId: data?.employees[0]?.id ?? '',
          type: 'CASUAL',
          fromDate: '',
          toDate: '',
          reason: '',
        }}
        onSubmit={apply}
        submitLabel="Submit application"
        size="lg"
      />
    </div>
  )
}

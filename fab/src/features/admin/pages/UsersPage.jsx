import { useCallback, useMemo, useState } from 'react'
import { z } from 'zod'
import { MoreHorizontal, Pencil, Plus, ShieldOff, UserCheck } from 'lucide-react'
import { Avatar, Badge, Button, Dropdown } from '@/components/ui'
import { DataTable, PageHeader, RecordDrawer } from '@/components/shared'
import { useAsync } from '@/hooks'
import { useCan } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { recordAudit, userService } from '@/services/adminService'
import { roles } from '@/config/roles'
import { formatRelative } from '@/utils/format'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  role: z.string().min(1, 'Role is required'),
  title: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  active: z.boolean().default(true),
})

const fields = [
  { name: 'name', label: 'Full name', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'role', label: 'Role', type: 'select', required: true, options: roles.map((role) => ({ value: role.id, label: role.label })) },
  { name: 'title', label: 'Job title' },
  { name: 'department', label: 'Department' },
  { name: 'phone', label: 'Phone' },
  { name: 'location', label: 'Location' },
  { name: 'active', label: 'Account active', type: 'switch' },
]

const defaults = { name: '', email: '', role: 'MERCHANDISER', title: '', department: '', phone: '', location: '', active: true, password: 'demo123', clientId: null, employeeId: null }

export function UsersPage() {
  const can = useCan()
  const [editing, setEditing] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const load = useCallback(() => userService.list(), [])
  const { data, loading, error, reload } = useAsync(load)

  const openEdit = useCallback((row) => {
    setEditing(row)
    setDrawerOpen(true)
  }, [])

  const toggleActive = useCallback(
    async (user) => {
      await userService.update(user.id, { active: !user.active })
      void recordAudit({
        action: 'USER_STATUS_CHANGED',
        module: 'admin',
        entity: user.email,
        description: `${user.active ? 'Deactivated' : 'Reactivated'} ${user.email}`,
      })
      toast.success(user.active ? 'Account deactivated' : 'Account reactivated')
      reload()
    },
    [reload],
  )

  const save = async (values) => {
    if (editing) {
      await userService.update(editing.id, values)
      void recordAudit({
        action: 'USER_ROLE_CHANGED',
        module: 'admin',
        entity: values.email,
        description: `Updated ${values.email} — role ${values.role}`,
      })
      toast.success('User updated')
    } else {
      await userService.create({ ...defaults, ...values, lastLoginAt: null })
      void recordAudit({
        action: 'USER_CREATED',
        module: 'admin',
        entity: values.email,
        description: `Created ${values.email} with role ${values.role}`,
      })
      toast.success('User created', 'They can sign in with the password demo123.')
    }
    reload()
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'User',
        cell: ({ row }) => (
          <span className="flex items-center gap-2.5">
            <Avatar name={row.original.name} size="sm" />
            <span className="flex flex-col leading-tight">
              <span className="font-medium text-text">{row.original.name}</span>
              <span className="text-xs text-muted">{row.original.email}</span>
            </span>
          </span>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ getValue }) => <Badge tone="primary">{getValue()}</Badge>,
      },
      { accessorKey: 'title', header: 'Title', cell: ({ getValue }) => getValue() || '—' },
      { accessorKey: 'department', header: 'Department', cell: ({ getValue }) => getValue() || '—' },
      {
        accessorKey: 'lastLoginAt',
        header: 'Last sign-in',
        cell: ({ getValue }) => (getValue() ? formatRelative(getValue()) : 'Never'),
      },
      {
        accessorKey: 'active',
        header: 'Status',
        cell: ({ getValue }) => (
          <Badge tone={getValue() ? 'success' : 'danger'} dot>
            {getValue() ? 'Active' : 'Disabled'}
          </Badge>
        ),
      },
      ...(can('admin', 'edit')
        ? [
            {
              id: 'actions',
              header: '',
              enableSorting: false,
              enableHiding: false,
              meta: { width: 48, align: 'right' },
              cell: ({ row }) => (
                <span onClick={(event) => event.stopPropagation()} role="presentation">
                  <Dropdown
                    align="end"
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label="User actions">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    }
                    items={[
                      { label: 'Edit user', icon: Pencil, onSelect: () => openEdit(row.original) },
                      {
                        label: row.original.active ? 'Deactivate' : 'Reactivate',
                        icon: row.original.active ? ShieldOff : UserCheck,
                        danger: row.original.active,
                        onSelect: () => toggleActive(row.original),
                      },
                    ]}
                  />
                </span>
              ),
            },
          ]
        : []),
    ],
    [can, openEdit, toggleActive],
  )

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Users"
        description="Accounts that can sign in, and the role each one carries."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Users' }]}
        actions={
          can('admin', 'create') && (
            <Button onClick={() => { setEditing(null); setDrawerOpen(true) }}>
              <Plus className="size-4" /> New user
            </Button>
          )
        }
      />

      <DataTable
        data={data ?? []}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={reload}
        onRowClick={can('admin', 'edit') ? openEdit : undefined}
        exportFileName="apparelflow-users"
        searchPlaceholder="Search users…"
        emptyTitle="No users yet"
      />

      <RecordDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? 'Edit user' : 'New user'}
        description={editing ? editing.email : 'Every demo account uses the password demo123.'}
        schema={schema}
        fields={fields}
        defaultValues={editing ? { ...defaults, ...editing } : defaults}
        onSubmit={save}
        submitLabel={editing ? 'Save changes' : 'Create user'}
        size="lg"
      />
    </div>
  )
}

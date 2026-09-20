import { useCallback, useMemo, useState } from 'react'
import { Badge, Avatar } from '@/components/ui'
import { DataTable, FilterBar, PageHeader } from '@/components/shared'
import { useAsync } from '@/hooks'
import { auditLogService } from '@/services/adminService'
import { formatDate, formatRelative, titleCase } from '@/utils/format'
import { MODULE_LABELS } from '@/config/permissions'
import { roles } from '@/config/roles'

const MODULE_TONES = {
  orders: 'primary',
  design: 'info',
  costing: 'info',
  sourcing: 'warning',
  quality: 'success',
  logistics: 'info',
  finance: 'success',
  admin: 'danger',
  auth: 'default',
}

/** Admin → Audit log: who changed what, with module and actor filters. */
export function AuditLogPage() {
  const [filters, setFilters] = useState({})

  const load = useCallback(
    () =>
      auditLogService.list({
        filters: {
          ...(filters.module ? { module: filters.module } : {}),
          ...(filters.actorRole ? { actorRole: filters.actorRole } : {}),
          ...(filters.at?.from || filters.at?.to ? { at: filters.at } : {}),
        },
      }),
    [filters],
  )
  const { data, loading, error, reload } = useAsync(load, [filters])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'at',
        header: 'When',
        cell: ({ getValue }) => (
          <span className="flex flex-col leading-tight">
            <span className="text-text">{formatDate(getValue(), 'dd MMM, HH:mm')}</span>
            <span className="text-xs text-muted">{formatRelative(getValue())}</span>
          </span>
        ),
      },
      {
        accessorKey: 'actorName',
        header: 'Actor',
        cell: ({ row }) => (
          <span className="flex items-center gap-2">
            <Avatar name={row.original.actorName} size="xs" />
            <span className="flex flex-col leading-tight">
              <span className="text-text">{row.original.actorName}</span>
              <span className="text-xs text-muted">{row.original.actorRole}</span>
            </span>
          </span>
        ),
      },
      {
        accessorKey: 'module',
        header: 'Module',
        cell: ({ getValue }) => (
          <Badge tone={MODULE_TONES[getValue()] ?? 'default'} size="sm">
            {MODULE_LABELS[getValue()] ?? titleCase(getValue())}
          </Badge>
        ),
      },
      {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ getValue }) => (
          <code className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted">
            {getValue()}
          </code>
        ),
      },
      { accessorKey: 'description', header: 'Description', meta: { width: '34%' } },
      {
        accessorKey: 'ipAddress',
        header: 'Source',
        cell: ({ row }) => (
          <span className="flex flex-col leading-tight text-xs text-muted">
            <span>{row.original.ipAddress}</span>
            <span>{row.original.userAgent}</span>
          </span>
        ),
      },
    ],
    [],
  )

  const filterConfig = [
    {
      key: 'module',
      label: 'Module',
      options: Object.entries(MODULE_LABELS).map(([value, label]) => ({ value, label })),
    },
    {
      key: 'actorRole',
      label: 'Role',
      options: roles.map((role) => ({ value: role.id, label: role.label })),
    },
    { key: 'at', label: 'Date', type: 'dateRange' },
  ]

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Audit log"
        description="Every change made through the app, newest first."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Audit log' }]}
      />

      <DataTable
        data={data ?? []}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={reload}
        filters={<FilterBar filters={filterConfig} values={filters} onChange={setFilters} />}
        exportFileName="apparelflow-audit-log"
        searchPlaceholder="Search the audit log…"
        emptyTitle="No entries match these filters"
        emptyDescription="Clear the filters to see the full history."
        initialSort={[{ id: 'at', desc: true }]}
        pageSize={25}
        dense
      />
    </div>
  )
}

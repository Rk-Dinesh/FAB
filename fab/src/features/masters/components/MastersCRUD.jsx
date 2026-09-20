import { useCallback, useMemo, useState } from 'react'
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button, ConfirmModal, Dropdown } from '@/components/ui'
import { DataTable, PageHeader, RecordDrawer } from '@/components/shared'
import { useAsync } from '@/hooks'
import { useCan } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { recordAudit } from '@/services/adminService'

/**
 * One config-driven CRUD screen, reused by all 15 masters. Create and edit both
 * happen in a right-side drawer; delete asks first.
 *
 * @param {{configKey: string, config: import('../config').MasterConfig,
 *   module?: string}} props
 */
export function MastersCRUD({ configKey, config, module = 'masters' }) {
  const can = useCan()
  const [editing, setEditing] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [removing, setRemoving] = useState(false)

  const load = useCallback(() => config.service.list(), [config.service])
  const { data, loading, error, reload } = useAsync(load, [configKey])

  const openCreate = () => {
    setEditing(null)
    setDrawerOpen(true)
  }
  const openEdit = useCallback((row) => {
    setEditing(row)
    setDrawerOpen(true)
  }, [])

  const save = async (values) => {
    if (editing) {
      await config.service.update(editing.id, values)
      // Auditing is fire-and-forget so it never adds latency to the save.
      void recordAudit({
        action: 'MASTER_UPDATED',
        module,
        entity: values.name ?? values.code ?? editing.id,
        description: `Updated ${config.singular} ${values.name ?? values.code ?? editing.id}`,
      })
      toast.success(`${capitalise(config.singular)} updated`)
    } else {
      const created = await config.service.create(values)
      void recordAudit({
        action: 'MASTER_CREATED',
        module,
        entity: created.name ?? created.code ?? created.id,
        description: `Created ${config.singular} ${created.name ?? created.code ?? created.id}`,
      })
      toast.success(`${capitalise(config.singular)} created`)
    }
    reload()
  }

  const confirmDelete = async () => {
    setRemoving(true)
    try {
      await config.service.remove(deleting.id)
      toast.success(`${capitalise(config.singular)} deleted`)
      setDeleting(null)
      reload()
    } catch (deleteError) {
      toast.error('Could not delete', deleteError.message)
    } finally {
      setRemoving(false)
    }
  }

  const canEdit = can(module, 'edit')
  const canCreate = can(module, 'create') && !config.singleton
  const canDelete = can(module, 'delete') && !config.singleton

  const columns = useMemo(() => {
    if (!canEdit && !canDelete) return config.columns
    return [
      ...config.columns,
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
                <Button variant="ghost" size="icon-sm" aria-label="Row actions">
                  <MoreHorizontal className="size-4" />
                </Button>
              }
              items={[
                ...(canEdit ? [{ label: 'Edit', icon: Pencil, onSelect: () => openEdit(row.original) }] : []),
                ...(canDelete
                  ? [{ label: 'Delete', icon: Trash2, danger: true, onSelect: () => setDeleting(row.original) }]
                  : []),
              ]}
            />
          </span>
        ),
      },
    ]
  }, [config.columns, canEdit, canDelete, openEdit])

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={config.title}
        description={config.description}
        breadcrumbs={[{ label: 'Masters', to: '/app/masters/company' }, { label: config.title }]}
        actions={
          canCreate && (
            <Button onClick={openCreate}>
              <Plus className="size-4" /> New {config.singular}
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
        onRowClick={canEdit ? openEdit : undefined}
        exportFileName={`apparelflow-${configKey}`}
        searchPlaceholder={`Search ${config.title.toLowerCase()}…`}
        emptyTitle={`No ${config.title.toLowerCase()} yet`}
        emptyDescription={config.description}
        emptyAction={canCreate && <Button size="sm" onClick={openCreate}>Add the first one</Button>}
      />

      <RecordDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? `Edit ${config.singular}` : `New ${config.singular}`}
        description={config.description}
        schema={config.schema}
        fields={config.fields}
        defaultValues={editing ? { ...config.defaults, ...editing } : config.defaults}
        onSubmit={save}
        submitLabel={editing ? 'Save changes' : `Create ${config.singular}`}
        size="lg"
      />

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={removing}
        title={`Delete this ${config.singular}?`}
        description={
          deleting
            ? `${deleting.name ?? deleting.code ?? deleting.id} will be removed from the demo data for this session.`
            : undefined
        }
        confirmLabel="Delete"
      />
    </div>
  )
}

/** @param {string} value */
function capitalise(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

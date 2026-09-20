import { useState } from 'react'
import { RotateCcw, Save, ShieldCheck } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle } from '@/components/ui'
import { PageHeader } from '@/components/shared'
import { useCan } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { roles } from '@/config/roles'
import { MODULES } from '@/config/permissions'
import {
  loadPermissionMatrix,
  recordAudit,
  resetPermissionMatrix,
  savePermissionMatrix,
} from '@/services/adminService'
import { PermissionMatrix } from '../components/PermissionMatrix'

/** Admin → Roles: pick a role, edit its grants, save for the session. */
export function RolesPage() {
  const can = useCan()
  const readOnly = !can('admin', 'edit')
  const [matrix, setMatrix] = useState(() => loadPermissionMatrix())
  const [selected, setSelected] = useState('MERCHANDISER')
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  const grants = matrix[selected] ?? {}

  const toggle = (module, action) => {
    setMatrix((current) => {
      const roleGrants = { ...(current[selected] ?? {}) }
      const existing = roleGrants[module] ?? []
      // Expand a wildcard the moment someone edits one of its actions.
      const expanded = existing.includes('*')
        ? ['view', 'create', 'edit', 'delete', 'approve']
        : existing
      const next = expanded.includes(action)
        ? expanded.filter((entry) => entry !== action)
        : [...expanded, action]

      if (next.length === 0) delete roleGrants[module]
      else roleGrants[module] = next

      return { ...current, [selected]: roleGrants }
    })
    setDirty(true)
  }

  const save = async () => {
    setSaving(true)
    savePermissionMatrix(matrix)
    await recordAudit({
      action: 'PERMISSION_UPDATED',
      module: 'admin',
      entity: selected,
      description: `Updated the permission matrix for ${selected}`,
    })
    setDirty(false)
    setSaving(false)
    toast.success('Permissions saved', 'Stored for this demo session.')
  }

  const reset = () => {
    setMatrix(resetPermissionMatrix())
    setDirty(false)
    toast.show('Permissions reset to the shipped defaults')
  }

  const grantedCount = (roleId) =>
    Object.values(matrix[roleId] ?? {}).reduce(
      (sum, actions) => sum + (actions.includes('*') ? 5 : actions.length),
      0,
    )

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Roles & permissions"
        description="What each role may see and do, module by module."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Roles' }]}
        actions={
          !readOnly && (
            <>
              <Button variant="secondary" onClick={reset}>
                <RotateCcw className="size-4" /> Reset to defaults
              </Button>
              <Button onClick={save} loading={saving} disabled={!dirty}>
                <Save className="size-4" /> Save changes
              </Button>
            </>
          )
        }
      />

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Roles</CardTitle>
          </CardHeader>
          <nav className="p-2">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelected(role.id)}
                className={cn(
                  'flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition-colors',
                  selected === role.id ? 'bg-primary-soft text-primary' : 'hover:bg-surface-2',
                )}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="text-sm font-medium">{role.label}</span>
                  <span className="text-[11px] tabular-nums text-muted">
                    {grantedCount(role.id)}/{MODULES.length * 5}
                  </span>
                </span>
                <span className="text-[11px] leading-snug text-muted">{role.description}</span>
              </button>
            ))}
          </nav>
        </Card>

        <Card>
          <CardHeader
            actions={
              <Badge
                tone={selected === 'SUPER_ADMIN' ? 'danger' : 'primary'}
                icon={<ShieldCheck className="size-3" />}
              >
                {selected}
              </Badge>
            }
          >
            <CardTitle>
              {roles.find((role) => role.id === selected)?.label} permissions
            </CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <PermissionMatrix role={selected} grants={grants} onToggle={toggle} readOnly={readOnly} />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

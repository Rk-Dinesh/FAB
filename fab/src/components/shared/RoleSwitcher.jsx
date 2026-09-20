import { useNavigate } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Dropdown } from '@/components/ui/Dropdown'
import { useAuthStore } from '@/store/authStore'
import { roleHome, roles } from '@/config/roles'
import { toast } from '@/store/toastStore'

/**
 * Dev-only role switcher: re-evaluates every permission check against another
 * role without signing out, so RBAC is reviewable in one session.
 */
export function RoleSwitcher() {
  const navigate = useNavigate()
  const signedInRole = useAuthStore((state) => state.role)
  const impersonatedRole = useAuthStore((state) => state.impersonatedRole)
  const impersonateRole = useAuthStore((state) => state.impersonateRole)

  if (!signedInRole) return null
  const active = impersonatedRole ?? signedInRole

  const select = (roleId) => {
    impersonateRole(roleId)
    if (roleId !== signedInRole) {
      toast.info(`Viewing as ${roleId}`, 'Dev-only role switch — permissions now follow this role.')
    }
    navigate(roleHome(roleId))
  }

  return (
    <Dropdown
      align="end"
      trigger={
        <button
          type="button"
          aria-label="Switch role (dev only)"
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2 text-xs font-medium transition-colors',
            impersonatedRole
              ? 'border-warning/40 bg-warning-soft text-warning'
              : 'border-border bg-surface-2/60 text-muted hover:text-text',
          )}
        >
          <FlaskConical className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{active}</span>
        </button>
      }
      items={[
        { heading: 'View as role (dev)' },
        ...roles.map((role) => ({
          label: role.id === active ? `${role.label} ✓` : role.label,
          onSelect: () => select(role.id),
        })),
      ]}
    />
  )
}

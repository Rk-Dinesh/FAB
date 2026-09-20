import { cn } from '@/utils/cn'
import { roles } from '@/config/roles'

/**
 * "Quick login as" cards — one per role, so a reviewer can see every RBAC view
 * without hunting for credentials.
 * @param {{onSelect: (roleId: string) => void, pending?: string|null,
 *   disabled?: boolean}} props
 */
export function RoleQuickLogin({ onSelect, pending, disabled }) {
  return (
    <div>
      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted">or quick login as</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {roles.map((role) => (
          <button
            key={role.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(role.id)}
            title={role.description}
            className={cn(
              'group rounded-lg border border-border bg-surface px-3 py-2 text-left transition-colors',
              'hover:border-primary hover:bg-primary-soft',
              'disabled:cursor-not-allowed disabled:opacity-50',
              pending === role.id && 'border-primary bg-primary-soft',
            )}
          >
            <span className="block text-sm font-medium text-text">{role.label}</span>
            <span className="mt-0.5 block truncate text-[11px] text-muted">
              {pending === role.id ? 'Signing in…' : role.id.toLowerCase()}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

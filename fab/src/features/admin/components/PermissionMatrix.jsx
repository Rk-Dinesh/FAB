import { Check, Minus } from 'lucide-react'
import { cn } from '@/utils/cn'
import { ACTIONS, MODULE_LABELS, MODULES } from '@/config/permissions'

/**
 * The editable role → module → action grid.
 * `'*'` on a module means every action, and is rendered as all five ticked.
 *
 * @param {{role: string, grants: Record<string, string[]>,
 *   onToggle: (module: string, action: string) => void, readOnly?: boolean}} props
 */
export function PermissionMatrix({ role, grants, onToggle, readOnly = false }) {
  const has = (module, action) => {
    const granted = grants?.[module]
    return Boolean(granted && (granted.includes('*') || granted.includes(action)))
  }
  const isWildcard = (module) => grants?.[module]?.includes('*')

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Permissions for the {role} role</caption>
        <thead>
          <tr className="bg-surface-2/50">
            <th
              scope="col"
              className="border-b border-border px-3 py-2.5 text-left text-xs font-semibold text-muted"
            >
              Module
            </th>
            {ACTIONS.map((action) => (
              <th
                key={action}
                scope="col"
                className="w-20 border-b border-border px-2 py-2.5 text-center text-xs font-semibold capitalize text-muted"
              >
                {action}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MODULES.map((module) => (
            <tr key={module} className="border-b border-border last:border-0">
              <th scope="row" className="px-3 py-2 text-left font-medium text-text">
                {MODULE_LABELS[module]}
                {isWildcard(module) && (
                  <span className="ml-2 rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    ALL
                  </span>
                )}
              </th>
              {ACTIONS.map((action) => {
                const granted = has(module, action)
                return (
                  <td key={action} className="px-2 py-2 text-center">
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => onToggle(module, action)}
                      aria-label={`${granted ? 'Revoke' : 'Grant'} ${action} on ${MODULE_LABELS[module]} for ${role}`}
                      aria-pressed={granted}
                      className={cn(
                        'inline-flex size-6 items-center justify-center rounded border transition-colors',
                        granted
                          ? 'border-primary bg-primary text-primary-fg'
                          : 'border-border bg-surface text-muted hover:border-border-strong',
                        readOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                      )}
                    >
                      {granted ? (
                        <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                      ) : (
                        <Minus className="size-3 opacity-40" aria-hidden="true" />
                      )}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

import { useRef } from 'react'
import { cn } from '@/utils/cn'

/**
 * Controlled tab bar. Keeps the panel rendering to the caller so tab content
 * can lazy-load its own data.
 * @param {{tabs: Array<{value: string, label: string, icon?: import('react').ElementType,
 *   count?: number, disabled?: boolean}>,
 *   value: string, onChange: (value: string) => void,
 *   variant?: 'underline'|'pill', className?: string}} props
 */
export function Tabs({ tabs, value, onChange, variant = 'underline', className }) {
  const listRef = useRef(null)

  const onKeyDown = (event) => {
    const enabled = tabs.filter((tab) => !tab.disabled)
    const index = enabled.findIndex((tab) => tab.value === value)
    if (index === -1) return
    let next = null
    if (event.key === 'ArrowRight') next = enabled[(index + 1) % enabled.length]
    if (event.key === 'ArrowLeft') next = enabled[(index - 1 + enabled.length) % enabled.length]
    if (event.key === 'Home') next = enabled[0]
    if (event.key === 'End') next = enabled[enabled.length - 1]
    if (next) {
      event.preventDefault()
      onChange(next.value)
      listRef.current?.querySelector(`[data-tab="${next.value}"]`)?.focus()
    }
  }

  const pill = variant === 'pill'

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={onKeyDown}
      className={cn(
        'flex items-center gap-1 overflow-x-auto scrollbar-none',
        pill ? 'rounded-lg bg-surface-2 p-1' : 'border-b border-border',
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.value === value
        const Icon = tab.icon
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            data-tab={tab.value}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => onChange(tab.value)}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors',
              'disabled:cursor-not-allowed disabled:opacity-40',
              pill
                ? cn(
                    'h-8 rounded-md px-3',
                    active
                      ? 'bg-surface text-text shadow-sm'
                      : 'text-muted hover:text-text',
                  )
                : cn(
                    '-mb-px h-10 border-b-2 px-3',
                    active
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted hover:border-border-strong hover:text-text',
                  ),
            )}
          >
            {Icon && <Icon className="size-4" aria-hidden="true" />}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                  active ? 'bg-primary-soft text-primary' : 'bg-surface-2 text-muted',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

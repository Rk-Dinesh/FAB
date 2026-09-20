import { cloneElement, useCallback, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'
import { useEscapeKey, useOnClickOutside } from '@/hooks'

/**
 * Menu anchored to a trigger element, rendered in a portal so it escapes
 * table/overflow clipping.
 * @param {{trigger: import('react').ReactElement,
 *   items: Array<{label?: string, icon?: import('react').ElementType,
 *     onSelect?: () => void, danger?: boolean, disabled?: boolean,
 *     separator?: boolean, heading?: string}>,
 *   align?: 'start'|'end', className?: string}} props
 */
export function Dropdown({ trigger, items = [], align = 'end', className, children }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const close = useCallback(() => setOpen(false), [])
  useOnClickOutside([triggerRef, menuRef], close, open)
  useEscapeKey(close, open)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPosition({ top: rect.bottom + 6, left: rect.left, width: rect.width, right: rect.right })
  }, [open])

  const menuWidth = 208

  return (
    <>
      <span ref={triggerRef} className="inline-flex">
        {cloneElement(trigger, {
          onClick: (event) => {
            trigger.props.onClick?.(event)
            setOpen((value) => !value)
          },
          'aria-haspopup': 'menu',
          'aria-expanded': open,
        })}
      </span>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              top: position.top,
              left:
                align === 'end'
                  ? Math.max(8, (position.right ?? 0) - menuWidth)
                  : Math.min(position.left, window.innerWidth - menuWidth - 8),
              minWidth: menuWidth,
            }}
            className={cn(
              'fixed z-50 overflow-hidden rounded-lg border border-border bg-surface py-1',
              'shadow-lg animate-slide-up',
              className,
            )}
          >
            {children
              ? children({ close })
              : items.map((item, index) => {
                  if (item.separator)
                    return (
                      <div
                        key={`sep-${index}`}
                        className="my-1 h-px bg-border"
                        role="separator"
                      />
                    )
                  if (item.heading)
                    return (
                      <div
                        key={`head-${index}`}
                        className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted"
                      >
                        {item.heading}
                      </div>
                    )
                  const Icon = item.icon
                  return (
                    <button
                      key={item.label}
                      type="button"
                      role="menuitem"
                      disabled={item.disabled}
                      onClick={() => {
                        item.onSelect?.()
                        close()
                      }}
                      className={cn(
                        'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
                        'disabled:cursor-not-allowed disabled:opacity-40',
                        item.danger
                          ? 'text-danger hover:bg-danger-soft'
                          : 'text-text hover:bg-surface-2',
                      )}
                    >
                      {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
                      <span className="truncate">{item.label}</span>
                    </button>
                  )
                })}
          </div>,
          document.body,
        )}
    </>
  )
}

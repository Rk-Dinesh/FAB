import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'

/**
 * Hover/focus tooltip. Wraps its children in a span, so it works on any element.
 * @param {{content: import('react').ReactNode, side?: 'top'|'bottom'|'left'|'right',
 *   className?: string, children: import('react').ReactNode}} props
 */
export function Tooltip({ content, side = 'top', className, children }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const anchorRef = useRef(null)

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    const offset = 8
    const positions = {
      top: { top: rect.top - offset, left: rect.left + rect.width / 2 },
      bottom: { top: rect.bottom + offset, left: rect.left + rect.width / 2 },
      left: { top: rect.top + rect.height / 2, left: rect.left - offset },
      right: { top: rect.top + rect.height / 2, left: rect.right + offset },
    }
    setCoords(positions[side])
  }, [open, side])

  const translate = {
    top: 'translate(-50%, -100%)',
    bottom: 'translate(-50%, 0)',
    left: 'translate(-100%, -50%)',
    right: 'translate(0, -50%)',
  }[side]

  if (!content) return children

  return (
    <>
      <span
        ref={anchorRef}
        className="inline-flex"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </span>
      {open &&
        createPortal(
          <div
            role="tooltip"
            style={{ top: coords.top, left: coords.left, transform: translate }}
            className={cn(
              'pointer-events-none fixed z-[60] max-w-xs rounded-md border border-border',
              'bg-surface px-2.5 py-1.5 text-xs text-text shadow-lg animate-fade-in',
              className,
            )}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  )
}

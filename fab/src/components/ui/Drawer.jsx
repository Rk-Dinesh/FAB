import { useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useEscapeKey, useFocusTrap, useLockBodyScroll } from '@/hooks'
import { Button } from './Button'

const WIDTHS = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-xl',
  xl: 'sm:max-w-3xl',
}

/**
 * Right-side (or left-side) sliding panel. Masters and record forms live here.
 * @param {{open: boolean, onClose: () => void, title?: string, description?: string,
 *   side?: 'right'|'left', size?: keyof typeof WIDTHS,
 *   footer?: import('react').ReactNode, children?: import('react').ReactNode}} props
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  side = 'right',
  size = 'md',
  footer,
  className,
  children,
}) {
  const panelRef = useRef(null)
  const handleClose = useCallback(() => onClose?.(), [onClose])

  useEscapeKey(handleClose, open)
  useLockBodyScroll(open)
  useFocusTrap(panelRef, open)

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'absolute inset-y-0 flex w-full flex-col border-border bg-surface shadow-2xl focus:outline-none',
          side === 'right'
            ? 'right-0 border-l animate-slide-in-right'
            : 'left-0 border-r animate-slide-in-left',
          WIDTHS[size],
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="truncate text-base font-semibold text-text">{title}</h2>}
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <Button variant="ghost" size="icon-sm" onClick={handleClose} aria-label="Close panel">
            <X className="size-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-border bg-surface-2/40 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

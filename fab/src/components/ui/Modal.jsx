import { useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useEscapeKey, useFocusTrap, useLockBodyScroll } from '@/hooks'
import { Button } from './Button'

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw]',
}

/**
 * @param {{open: boolean, onClose: () => void, title?: string, description?: string,
 *   size?: keyof typeof SIZES, footer?: import('react').ReactNode,
 *   closeOnOverlay?: boolean, children?: import('react').ReactNode}} props
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  closeOnOverlay = true,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={closeOnOverlay ? handleClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[90vh] w-full flex-col rounded-lg border border-border',
          'bg-surface shadow-xl animate-slide-up focus:outline-none',
          SIZES[size],
          className,
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div className="min-w-0">
              {title && <h2 className="text-base font-semibold text-text">{title}</h2>}
              {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            </div>
            <Button variant="ghost" size="icon-sm" onClick={handleClose} aria-label="Close dialog">
              <X className="size-4" />
            </Button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

/**
 * Confirmation dialog built on Modal — used for deletes and irreversible actions.
 */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant={variant} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  )
}

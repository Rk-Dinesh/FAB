import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useToastStore } from '@/store/toastStore'

const VARIANTS = {
  default: { icon: Info, tone: 'text-muted' },
  success: { icon: CheckCircle2, tone: 'text-success' },
  warning: { icon: AlertTriangle, tone: 'text-warning' },
  danger: { icon: XCircle, tone: 'text-danger' },
  info: { icon: Info, tone: 'text-info' },
}

/** Renders the global toast queue. Mounted once in the app providers. */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      role="region"
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
    >
      {toasts.map((item) => {
        const { icon: Icon, tone } = VARIANTS[item.variant] ?? VARIANTS.default
        return (
          <div
            key={item.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border border-border',
              'bg-surface p-3.5 shadow-lg animate-slide-up',
            )}
          >
            <Icon className={cn('mt-0.5 size-4 shrink-0', tone)} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text">{item.title}</p>
              {item.description && (
                <p className="mt-0.5 text-xs text-muted">{item.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss notification"
              className="rounded p-0.5 text-muted transition-colors hover:text-text"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )
      })}
    </div>,
    document.body,
  )
}

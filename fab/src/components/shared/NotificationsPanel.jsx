import { useNavigate } from 'react-router-dom'
import { BellOff, CheckCheck } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { useNotificationStore } from '@/store/notificationStore'
import { formatRelative } from '@/utils/format'

const TONES = {
  danger: 'bg-danger',
  warning: 'bg-warning',
  success: 'bg-success',
  info: 'bg-info',
}

/** Slide-over list of system notifications. */
export function NotificationsPanel({ open, onClose }) {
  const navigate = useNavigate()
  const notifications = useNotificationStore((state) => state.notifications)
  const markRead = useNotificationStore((state) => state.markRead)
  const markAllRead = useNotificationStore((state) => state.markAllRead)
  const unread = notifications.filter((item) => !item.read).length

  const openItem = (item) => {
    markRead(item.id)
    onClose()
    if (item.to) navigate(item.to)
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Notifications"
      description={unread > 0 ? `${unread} unread` : 'You are all caught up'}
      size="md"
      footer={
        <Button variant="secondary" size="sm" onClick={markAllRead} disabled={unread === 0}>
          <CheckCheck className="size-4" /> Mark all read
        </Button>
      }
    >
      {notifications.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="Nothing to show"
          description="Alerts about delays, rejected samples and overdue invoices land here."
          compact
        />
      ) : (
        <ul className="-mx-2 flex flex-col">
          {notifications.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => openItem(item)}
                className={cn(
                  'flex w-full gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-surface-2',
                  !item.read && 'bg-primary-soft/40',
                )}
              >
                <span
                  className={cn('mt-1.5 size-2 shrink-0 rounded-full', TONES[item.tone] ?? TONES.info)}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={cn('text-sm', item.read ? 'text-text' : 'font-semibold text-text')}>
                      {item.title}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted">
                      {formatRelative(item.at)}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                    {item.body}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  )
}

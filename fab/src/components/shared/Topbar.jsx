import { Bell, Menu, Search } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from './ThemeToggle'

/**
 * App topbar. Slots keep it dumb: auth-aware widgets (profile menu, role
 * switcher) are injected by AppLayout.
 * @param {{onMenuClick: () => void, onSearchClick?: () => void,
 *   notificationCount?: number, onNotificationsClick?: () => void,
 *   right?: import('react').ReactNode, className?: string}} props
 */
export function Topbar({
  onMenuClick,
  onSearchClick,
  notificationCount = 0,
  onNotificationsClick,
  right,
  className,
}) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border',
        'bg-surface/80 px-4 backdrop-blur',
        className,
      )}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="size-4" />
      </Button>

      <button
        type="button"
        onClick={onSearchClick}
        className={cn(
          'group flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border',
          'bg-surface-2/60 px-2.5 text-sm text-muted transition-colors',
          'hover:border-border-strong hover:text-text sm:max-w-xs',
        )}
      >
        <Search className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">Search orders, clients, vendors…</span>
        <kbd className="ml-auto hidden shrink-0 rounded border border-border bg-surface px-1.5 py-0.5 font-sans text-[10px] text-muted sm:inline">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onNotificationsClick}
          aria-label={`Notifications${notificationCount ? ` (${notificationCount} unread)` : ''}`}
          className="relative"
        >
          <Bell className="size-4" />
          {notificationCount > 0 && (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </Button>
        <ThemeToggle />
        {right}
      </div>
    </header>
  )
}

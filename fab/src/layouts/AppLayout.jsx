import { lazy, Suspense, useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { PageSpinner } from '@/components/ui'
import { Sidebar } from '@/components/shared/Sidebar'
import { Topbar } from '@/components/shared/Topbar'
import { UserMenu } from '@/components/shared/UserMenu'
import { RoleSwitcher } from '@/components/shared/RoleSwitcher'

import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { filterNavigation } from '@/config/permissions'
import { useKeyboardShortcut } from '@/hooks'
// Overlays, so they load the first time they're opened rather than with the shell.
const NotificationsPanel = lazy(() =>
  import('@/components/shared/NotificationsPanel').then((m) => ({ default: m.NotificationsPanel })),
)
const CommandPalette = lazy(() =>
  import('@/components/shared/CommandPalette').then((m) => ({ default: m.CommandPalette })),
)


/** Shell for every authenticated internal route. */
export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const role = useAuthStore((state) => state.impersonatedRole ?? state.role)
  const notifications = useNotificationStore((state) => state.notifications)
  const unread = notifications.filter((item) => !item.read).length

  const filter = useCallback((groups) => filterNavigation(groups, role), [role])
  const openSearch = useCallback(() => setSearchOpen(true), [])
  useKeyboardShortcut({ key: 'k', meta: true }, openSearch)

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} filter={filter} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onMenuClick={() => setNavOpen(true)}
          onSearchClick={openSearch}
          notificationCount={unread}
          onNotificationsClick={() => setNotificationsOpen(true)}
          right={
            <>
              <RoleSwitcher />
              <UserMenu />
            </>
          }
        />
        <main className="flex-1 px-4 py-5 sm:px-6">
          <Suspense fallback={<PageSpinner />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <Suspense fallback={null}>
        {notificationsOpen && (
          <NotificationsPanel open onClose={() => setNotificationsOpen(false)} />
        )}
        {searchOpen && <CommandPalette open onClose={() => setSearchOpen(false)} />}
      </Suspense>
    </div>
  )
}

import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/shared/Sidebar'
import { Topbar } from '@/components/shared/Topbar'
import { UserMenu } from '@/components/shared/UserMenu'
import { RoleSwitcher } from '@/components/shared/RoleSwitcher'
import { NotificationsPanel } from '@/components/shared/NotificationsPanel'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { filterNavigation } from '@/config/permissions'

/** Shell for every authenticated internal route. */
export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const role = useAuthStore((state) => state.impersonatedRole ?? state.role)
  const notifications = useNotificationStore((state) => state.notifications)
  const unread = notifications.filter((item) => !item.read).length

  const filter = useCallback((groups) => filterNavigation(groups, role), [role])

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} filter={filter} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onMenuClick={() => setNavOpen(true)}
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
          <Outlet />
        </main>
      </div>
      <NotificationsPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  )
}

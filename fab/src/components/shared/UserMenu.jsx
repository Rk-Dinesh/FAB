import { useNavigate } from 'react-router-dom'
import { DatabaseBackup, LayoutGrid, LifeBuoy, LogOut, User } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Dropdown } from '@/components/ui/Dropdown'
import { useAuthStore } from '@/store/authStore'
import { roleLabel } from '@/config/roles'
import { toast } from '@/store/toastStore'
import { useNotificationStore } from '@/store/notificationStore'

/** Topbar profile menu: identity, role, and sign out. */
export function UserMenu() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const role = useAuthStore((state) => state.impersonatedRole ?? state.role)
  const logout = useAuthStore((state) => state.logout)
  const resetNotifications = useNotificationStore((state) => state.reset)

  if (!user) return null

  const signOut = () => {
    logout()
    toast.show('Signed out')
    navigate('/login', { replace: true })
  }

  // Session edits live in localStorage; this drops them and reloads the seed.
  const resetData = async () => {
    // Imported here so the app shell doesn't carry the mock database.
    const { resetDemoData } = await import('@/mocks/db')
    resetDemoData()
    resetNotifications()
    toast.success('Demo data reset', 'Every record is back to its seeded state.')
    setTimeout(() => window.location.reload(), 600)
  }

  return (
    <Dropdown
      align="end"
      trigger={
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-surface-2"
          aria-label="Account menu"
        >
          <Avatar name={user.name} size="sm" />
          <span className="hidden min-w-0 flex-col items-start leading-tight sm:flex">
            <span className="max-w-[10rem] truncate text-xs font-medium text-text">
              {user.name}
            </span>
            <span className="text-[11px] text-muted">{roleLabel(role)}</span>
          </span>
        </button>
      }
      items={[
        { heading: user.email },
        { label: 'Profile', icon: User, onSelect: () => navigate('/app/admin/users') },
        { label: 'UI kit', icon: LayoutGrid, onSelect: () => navigate('/app/ui-kit') },
        {
          label: 'Help & shortcuts',
          icon: LifeBuoy,
          onSelect: () => toast.info('Press ⌘K to search', 'Global search covers orders, clients, vendors and people.'),
        },
        { separator: true },
        { label: 'Reset demo data', icon: DatabaseBackup, onSelect: resetData },
        { label: 'Sign out', icon: LogOut, danger: true, onSelect: signOut },
      ]}
    />
  )
}

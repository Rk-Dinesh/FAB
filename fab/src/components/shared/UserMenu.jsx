import { useNavigate } from 'react-router-dom'
import { LayoutGrid, LifeBuoy, LogOut, User } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Dropdown } from '@/components/ui/Dropdown'
import { useAuthStore } from '@/store/authStore'
import { roleLabel } from '@/config/roles'
import { toast } from '@/store/toastStore'

/** Topbar profile menu: identity, role, and sign out. */
export function UserMenu() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const role = useAuthStore((state) => state.impersonatedRole ?? state.role)
  const logout = useAuthStore((state) => state.logout)

  if (!user) return null

  const signOut = () => {
    logout()
    toast.show('Signed out')
    navigate('/login', { replace: true })
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
        { label: 'Sign out', icon: LogOut, danger: true, onSelect: signOut },
      ]}
    />
  )
}

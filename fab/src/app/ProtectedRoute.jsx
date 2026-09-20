import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore, useCan } from '@/store/authStore'
import { roleHome } from '@/config/roles'

/**
 * Guards a route subtree: requires a session, optionally a module permission,
 * and keeps CLIENT users inside the portal.
 * @param {{module?: string, action?: string, area?: 'app'|'portal'}} props
 */
export function ProtectedRoute({ module, action = 'view', area = 'app' }) {
  const location = useLocation()
  const token = useAuthStore((state) => state.token)
  const role = useAuthStore((state) => state.impersonatedRole ?? state.role)
  const can = useCan()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  // Clients never see internal screens, and staff have no use for the portal.
  const isClient = role === 'CLIENT'
  if (area === 'app' && isClient) return <Navigate to="/portal/orders" replace />
  if (area === 'portal' && !isClient) return <Navigate to={roleHome(role)} replace />

  if (module && !can(module, action)) {
    return <Navigate to="/403" replace state={{ module, action }} />
  }

  return <Outlet />
}

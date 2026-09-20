import { useAuthStore } from '@/store/authStore'
import { ExecutiveDashboard } from './ExecutiveDashboard'
import { RoleDashboard } from './RoleDashboard'

/**
 * `/app/dashboard` — CXO and SUPER_ADMIN get the executive view; everyone else
 * gets their role's KPIs and needs-attention queue.
 */
export function DashboardPage() {
  const role = useAuthStore((state) => state.impersonatedRole ?? state.role)
  return ['CXO', 'SUPER_ADMIN'].includes(role) ? <ExecutiveDashboard /> : <RoleDashboard />
}

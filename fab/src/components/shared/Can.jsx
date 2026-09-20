import { useCan } from '@/store/authStore'

/**
 * Renders `children` only when the current role holds the permission.
 * @param {{module: string, action?: 'view'|'create'|'edit'|'delete'|'approve',
 *   fallback?: import('react').ReactNode, children: import('react').ReactNode}} props
 */
export function Can({ module, action = 'view', fallback = null, children }) {
  const can = useCan()
  return can(module, action) ? children : fallback
}

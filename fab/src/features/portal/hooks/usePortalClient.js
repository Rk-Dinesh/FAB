import { useAuthStore } from '@/store/authStore'
import { table } from '@/mocks/db'

/**
 * The brand the signed-in client user belongs to. Every portal query scopes to
 * this id, so a client can only ever see their own orders.
 *
 * @returns {{clientId: string|null, client: object|null}}
 */
export function usePortalClient() {
  const clientId = useAuthStore((state) => state.user?.clientId ?? null)
  const client = clientId ? (table('clients').find((entry) => entry.id === clientId) ?? null) : null
  return { clientId, client }
}

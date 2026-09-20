import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import users from '@/mocks/data/users.json'
import { can as canDo, permissions } from '@/config/permissions'

/** Simulated network latency, matching the mock service layer. */
const LATENCY = 450

/**
 * Strip the password before anything touches app state.
 * @param {object} user
 * @returns {object}
 */
function publicUser(user) {
  const safe = { ...user }
  delete safe.password
  return safe
}

/** Mock bearer token — shaped like a JWT so swapping in a real API is obvious. */
function mockToken(user) {
  return `mock.${btoa(`${user.id}:${user.role}`)}.${Date.now().toString(36)}`
}

/**
 * Auth state: `{ user, role, token }`, persisted in localStorage.
 * Nothing here talks to a server — `login` resolves against users.json.
 */
export const useAuthStore = create()(
  persist(
    (set, get) => ({
      /** @type {object|null} */
      user: null,
      /** @type {string|null} */
      role: null,
      /** @type {string|null} */
      token: null,
      /** Overrides the signed-in user's role for the dev role switcher only. */
      /** @type {string|null} */
      impersonatedRole: null,

      /**
       * @param {{email: string, password: string}} credentials
       * @returns {Promise<{ok: true, user: object} | {ok: false, error: string}>}
       */
      login: async ({ email, password }) => {
        await new Promise((resolve) => setTimeout(resolve, LATENCY))
        const match = users.find(
          (user) => user.email.toLowerCase() === String(email).trim().toLowerCase(),
        )
        if (!match) return { ok: false, error: 'No account found for that email address.' }
        if (match.password !== password) return { ok: false, error: 'That password is incorrect.' }
        if (!match.active) return { ok: false, error: 'This account has been deactivated.' }

        const user = publicUser(match)
        set({ user, role: user.role, token: mockToken(user), impersonatedRole: null })
        return { ok: true, user }
      },

      /**
       * Quick-login card on the sign-in page.
       * @param {string} roleId
       */
      loginAs: async (roleId) => {
        const match = users.find((user) => user.role === roleId && user.active)
        if (!match) return { ok: false, error: 'No demo user exists for that role.' }
        return get().login({ email: match.email, password: match.password })
      },

      logout: () => set({ user: null, role: null, token: null, impersonatedRole: null }),

      /**
       * Dev-only role switcher. Keeps the signed-in identity but re-evaluates
       * every permission check against the chosen role.
       * @param {string|null} roleId
       */
      impersonateRole: (roleId) =>
        set({ impersonatedRole: roleId === get().user?.role ? null : roleId }),

      /** The role that permission checks should use. */
      effectiveRole: () => get().impersonatedRole ?? get().role,

      /**
       * @param {string} module
       * @param {'view'|'create'|'edit'|'delete'|'approve'} [action]
       * @returns {boolean}
       */
      can: (module, action = 'view') => canDo(get().effectiveRole(), module, action, permissions),

      /** @param {object} patch */
      updateProfile: (patch) => set((state) => ({ user: { ...state.user, ...patch } })),
    }),
    {
      name: 'apparelflow-auth',
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        token: state.token,
        impersonatedRole: state.impersonatedRole,
      }),
    },
  ),
)

/**
 * Permission hook for components: `const can = useCan(); can('orders','edit')`.
 * @returns {(module: string, action?: string) => boolean}
 */
export function useCan() {
  const role = useAuthStore((state) => state.impersonatedRole ?? state.role)
  return (module, action = 'view') => canDo(role, module, action, permissions)
}

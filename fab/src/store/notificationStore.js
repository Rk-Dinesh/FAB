import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const HOUR = 60 * 60 * 1000

/** Dates are relative to load time so the demo never looks stale. */
function seed() {
  const now = Date.now()
  return [
    {
      id: 'NTF-001',
      title: 'Fit sample rejected',
      body: 'Northwind Apparel rejected the fit sample for NW-2431 — armhole 1.2 cm over tolerance.',
      tone: 'danger',
      module: 'design',
      to: '/app/design/samples',
      at: new Date(now - 2 * HOUR).toISOString(),
      read: false,
    },
    {
      id: 'NTF-002',
      title: 'Order PO-1042 is at risk',
      body: 'Stitching is 4 days behind plan against an ex-factory date of next Friday.',
      tone: 'warning',
      module: 'orders',
      to: '/app/orders',
      at: new Date(now - 5 * HOUR).toISOString(),
      read: false,
    },
    {
      id: 'NTF-003',
      title: 'GRN short received',
      body: 'Coimbatore Spinning Mills delivered 1,840 kg against a 2,000 kg material PO.',
      tone: 'warning',
      module: 'sourcing',
      to: '/app/sourcing/grn',
      at: new Date(now - 9 * HOUR).toISOString(),
      read: false,
    },
    {
      id: 'NTF-004',
      title: 'Final inspection passed',
      body: 'AQL 2.5 final inspection passed for Blue Harbor Co. order PO-1037.',
      tone: 'success',
      module: 'quality',
      to: '/app/quality/inspections',
      at: new Date(now - 26 * HOUR).toISOString(),
      read: true,
    },
    {
      id: 'NTF-005',
      title: 'Invoice overdue',
      body: 'INV-2026-0118 for Urban Loom is 12 days past its due date.',
      tone: 'danger',
      module: 'finance',
      to: '/app/finance/invoices',
      at: new Date(now - 30 * HOUR).toISOString(),
      read: true,
    },
  ]
}

export const useNotificationStore = create()(
  persist(
    (set, get) => ({
      notifications: seed(),

      /** @returns {number} */
      unreadCount: () => get().notifications.filter((item) => !item.read).length,

      /** @param {string} id */
      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((item) =>
            item.id === id ? { ...item, read: true } : item,
          ),
        })),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((item) => ({ ...item, read: true })),
        })),

      /** @param {Omit<object,'id'>} notification */
      push: (notification) =>
        set((state) => ({
          notifications: [
            {
              id: `NTF-${Date.now().toString(36)}`,
              at: new Date().toISOString(),
              read: false,
              tone: 'info',
              ...notification,
            },
            ...state.notifications,
          ],
        })),

      reset: () => set({ notifications: seed() }),
    }),
    { name: 'apparelflow-notifications' },
  ),
)

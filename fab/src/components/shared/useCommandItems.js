import { useMemo } from 'react'
import { Building2, Factory, Package, User } from 'lucide-react'
import { navigation } from '@/config/navigation'
import { filterNavigation } from '@/config/permissions'
import { useAuthStore } from '@/store/authStore'
import { table } from '@/mocks/db'

/**
 * Searchable entries for the command palette: every page the current role can
 * reach, plus orders, clients, vendors and people it is allowed to see.
 *
 * Only built while the palette is open, so it costs nothing the rest of the time.
 *
 * @param {boolean} enabled
 * @returns {Array<{id: string, title: string, subtitle?: string, group: string,
 *   to: string, icon?: import('react').ElementType, haystack: string}>}
 */
export function useCommandItems(enabled) {
  const role = useAuthStore((state) => state.impersonatedRole ?? state.role)

  return useMemo(() => {
    if (!enabled || !role) return []

    const items = []
    const push = (entry) =>
      items.push({
        ...entry,
        haystack: [entry.title, entry.subtitle, entry.group].filter(Boolean).join(' ').toLowerCase(),
      })

    for (const group of filterNavigation(navigation, role)) {
      if (group.to) {
        push({ id: `page-${group.to}`, title: group.label, group: 'Pages', to: group.to, icon: group.icon })
      }
      for (const child of group.children ?? []) {
        push({
          id: `page-${child.to}`,
          title: child.label,
          subtitle: group.label,
          group: 'Pages',
          to: child.to,
          icon: group.icon,
        })
      }
    }

    const can = (module) => filterNavigation(navigation, role).some((group) => group.module === module)

    if (can('orders')) {
      for (const order of table('orders')) {
        push({
          id: order.id,
          title: `${order.poNumber} — ${order.styleName}`,
          subtitle: `${order.clientName} · ${order.status.replace(/_/g, ' ').toLowerCase()}`,
          group: 'Orders',
          to: `/app/orders/${order.id}`,
          icon: Package,
        })
      }
    }

    if (can('crm')) {
      for (const client of table('clients')) {
        push({
          id: client.id,
          title: client.name,
          subtitle: `${client.segment} · ${client.city}, ${client.country}`,
          group: 'Clients',
          to: '/app/crm/clients',
          icon: Building2,
        })
      }
    }

    if (can('sourcing')) {
      for (const vendor of table('vendors')) {
        push({
          id: vendor.id,
          title: vendor.name,
          subtitle: `${vendor.typeLabel} · ${vendor.city}`,
          group: 'Vendors',
          to: '/app/sourcing/vendors',
          icon: Factory,
        })
      }
    }

    if (can('hr')) {
      for (const employee of table('employees')) {
        push({
          id: employee.id,
          title: employee.name,
          subtitle: `${employee.title} · ${employee.department}`,
          group: 'People',
          to: '/app/hr/employees',
          icon: User,
        })
      }
    }

    return items
  }, [enabled, role])
}

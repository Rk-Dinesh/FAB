import { Link } from 'react-router-dom'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui'
import { navigation } from '@/config/navigation'
import { filterNavigation } from '@/config/permissions'

/** The handful of screens a role actually opens most days. */
const ROLE_LINKS = {
  MERCHANDISER: ['/app/orders', '/app/crm/enquiries', '/app/costing/cost-sheets', '/app/client-updates'],
  DESIGNER: ['/app/design/samples', '/app/design/requests', '/app/design/tech-packs', '/app/orders'],
  SOURCING: ['/app/sourcing/rfq', '/app/sourcing/quote-comparison', '/app/sourcing/material-po', '/app/sourcing/grn'],
  PRODUCTION: ['/app/production/tracker', '/app/production/daily-output', '/app/production/gantt', '/app/production/allocation'],
  QC: ['/app/quality/inspections', '/app/quality/defects', '/app/orders'],
  LOGISTICS: ['/app/logistics/shipments', '/app/logistics/tracking', '/app/logistics/documents'],
  FINANCE: ['/app/finance/invoices', '/app/finance/order-pnl', '/app/finance/bills', '/app/finance/payments'],
  HR: ['/app/hr/leave', '/app/hr/attendance', '/app/hr/employees', '/app/hr/payroll'],
  CXO: ['/app/reports', '/app/orders', '/app/finance/order-pnl'],
  SUPER_ADMIN: ['/app/admin/users', '/app/admin/roles', '/app/admin/audit-log', '/app/ui-kit'],
}

/**
 * @param {{role: string}} props
 */
export function QuickLinks({ role }) {
  // Resolve each path back to its nav entry so labels and icons stay in one place.
  const allowed = filterNavigation(navigation, role)
  const entries = []
  for (const group of allowed) {
    if (group.to) entries.push({ to: group.to, label: group.label, icon: group.icon })
    for (const child of group.children ?? []) {
      entries.push({ to: child.to, label: child.label, icon: group.icon })
    }
  }

  const links = (ROLE_LINKS[role] ?? [])
    .map((path) => entries.find((entry) => entry.to === path))
    .filter(Boolean)
    .slice(0, 4)

  if (links.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jump back in</CardTitle>
      </CardHeader>
      <CardBody className="grid grid-cols-2 gap-2">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.to}
              to={link.to}
              className="flex flex-col gap-1.5 rounded-lg border border-border p-3 transition-colors hover:border-primary hover:bg-primary-soft"
            >
              {Icon && <Icon className="size-4 text-muted" aria-hidden="true" />}
              <span className="text-xs font-medium text-text">{link.label}</span>
            </Link>
          )
        })}
      </CardBody>
    </Card>
  )
}

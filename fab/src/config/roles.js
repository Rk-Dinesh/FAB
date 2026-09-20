/**
 * Roles are fixed in this mock — a real deployment would load them from the API.
 * `home` is where the role lands after signing in.
 */

/** @typedef {'SUPER_ADMIN'|'CXO'|'MERCHANDISER'|'DESIGNER'|'SOURCING'|'PRODUCTION'|'QC'|'LOGISTICS'|'FINANCE'|'HR'|'CLIENT'} RoleId */

/** @type {Array<{id: RoleId, label: string, description: string, home: string, tone: string}>} */
export const roles = [
  {
    id: 'SUPER_ADMIN',
    label: 'Super admin',
    description: 'Full access to every module, plus user and role administration.',
    home: '/app/dashboard',
    tone: 'danger',
  },
  {
    id: 'CXO',
    label: 'CXO',
    description: 'Executive dashboard, order book, margins and vendor performance.',
    home: '/app/dashboard',
    tone: 'primary',
  },
  {
    id: 'MERCHANDISER',
    label: 'Merchandiser',
    description: 'Owns the order end to end: enquiry, costing, T&A and client updates.',
    home: '/app/dashboard',
    tone: 'info',
  },
  {
    id: 'DESIGNER',
    label: 'Designer',
    description: 'Design requests, tech packs and sample approvals.',
    home: '/app/design/requests',
    tone: 'info',
  },
  {
    id: 'SOURCING',
    label: 'Sourcing',
    description: 'Vendors, RFQs, quote comparison, material POs and GRN.',
    home: '/app/sourcing/rfq',
    tone: 'warning',
  },
  {
    id: 'PRODUCTION',
    label: 'Production',
    description: 'Factory allocation, stage tracking and daily output.',
    home: '/app/production/tracker',
    tone: 'warning',
  },
  {
    id: 'QC',
    label: 'Quality',
    description: 'Inline and final AQL inspections, and the defect log.',
    home: '/app/quality/inspections',
    tone: 'success',
  },
  {
    id: 'LOGISTICS',
    label: 'Logistics',
    description: 'Shipment booking, export documents and tracking.',
    home: '/app/logistics/shipments',
    tone: 'info',
  },
  {
    id: 'FINANCE',
    label: 'Finance',
    description: 'Receivables, payables, payments, expenses and order P&L.',
    home: '/app/finance/invoices',
    tone: 'success',
  },
  {
    id: 'HR',
    label: 'HR',
    description: 'Employees, attendance, leave and payroll.',
    home: '/app/hr/employees',
    tone: 'primary',
  },
  {
    id: 'CLIENT',
    label: 'Client',
    description: 'Brand portal: own orders, tracking, approvals and shipments.',
    home: '/portal/orders',
    tone: 'default',
  },
]

/** @type {Record<RoleId, (typeof roles)[number]>} */
export const roleById = Object.fromEntries(roles.map((role) => [role.id, role]))

/**
 * @param {string} roleId
 * @returns {string} human label, falling back to the raw id
 */
export function roleLabel(roleId) {
  return roleById[roleId]?.label ?? roleId
}

/**
 * Where a role should land after login.
 * @param {string} roleId
 * @returns {string}
 */
export function roleHome(roleId) {
  return roleById[roleId]?.home ?? '/app/dashboard'
}

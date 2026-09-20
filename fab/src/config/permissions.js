/**
 * Role → module → actions.
 *
 * Modules match the `module` keys in config/navigation.js. Actions are
 * view | create | edit | delete | approve. `'*'` means every action.
 * SUPER_ADMIN is handled as a special case so the matrix stays readable.
 */

export const MODULES = [
  'dashboard',
  'crm',
  'design',
  'costing',
  'orders',
  'sourcing',
  'production',
  'quality',
  'logistics',
  'clientUpdates',
  'finance',
  'hr',
  'reports',
  'masters',
  'admin',
  'portal',
]

export const ACTIONS = ['view', 'create', 'edit', 'delete', 'approve']

/** Human labels for the admin permission-matrix UI. */
export const MODULE_LABELS = {
  dashboard: 'Dashboard',
  crm: 'CRM',
  design: 'Design',
  costing: 'Costing',
  orders: 'Orders',
  sourcing: 'Sourcing',
  production: 'Production',
  quality: 'Quality',
  logistics: 'Logistics',
  clientUpdates: 'Client updates',
  finance: 'Finance',
  hr: 'HR',
  reports: 'Reports',
  masters: 'Masters',
  admin: 'Admin',
  portal: 'Client portal',
}

const ALL = ['*']
const VIEW = ['view']
const EDIT = ['view', 'create', 'edit']
const FULL = ['view', 'create', 'edit', 'delete']

/** @type {Record<string, Record<string, string[]>>} */
export const permissions = {
  SUPER_ADMIN: Object.fromEntries(MODULES.map((module) => [module, ALL])),

  CXO: {
    dashboard: VIEW,
    crm: VIEW,
    design: VIEW,
    costing: ['view', 'approve'],
    orders: ['view', 'approve'],
    sourcing: VIEW,
    production: VIEW,
    quality: VIEW,
    logistics: VIEW,
    clientUpdates: VIEW,
    finance: ['view', 'approve'],
    hr: VIEW,
    reports: VIEW,
    masters: VIEW,
  },

  MERCHANDISER: {
    dashboard: VIEW,
    crm: FULL,
    design: ['view', 'create', 'edit', 'approve'],
    costing: FULL,
    orders: FULL,
    sourcing: VIEW,
    production: VIEW,
    quality: VIEW,
    logistics: VIEW,
    clientUpdates: FULL,
    finance: VIEW,
    reports: VIEW,
    masters: VIEW,
  },

  DESIGNER: {
    dashboard: VIEW,
    crm: VIEW,
    design: ['view', 'create', 'edit', 'delete', 'approve'],
    costing: VIEW,
    orders: VIEW,
    masters: VIEW,
    reports: VIEW,
  },

  SOURCING: {
    dashboard: VIEW,
    crm: VIEW,
    costing: EDIT,
    orders: VIEW,
    sourcing: ['view', 'create', 'edit', 'delete', 'approve'],
    production: VIEW,
    quality: VIEW,
    masters: EDIT,
    reports: VIEW,
  },

  PRODUCTION: {
    dashboard: VIEW,
    orders: VIEW,
    sourcing: VIEW,
    production: ['view', 'create', 'edit', 'delete', 'approve'],
    quality: VIEW,
    logistics: VIEW,
    masters: VIEW,
    reports: VIEW,
  },

  QC: {
    dashboard: VIEW,
    orders: VIEW,
    production: VIEW,
    quality: ['view', 'create', 'edit', 'approve'],
    masters: VIEW,
    reports: VIEW,
  },

  LOGISTICS: {
    dashboard: VIEW,
    orders: VIEW,
    production: VIEW,
    quality: VIEW,
    logistics: ['view', 'create', 'edit', 'delete', 'approve'],
    clientUpdates: EDIT,
    masters: VIEW,
    reports: VIEW,
  },

  FINANCE: {
    dashboard: VIEW,
    crm: VIEW,
    costing: VIEW,
    orders: VIEW,
    sourcing: VIEW,
    logistics: VIEW,
    finance: ['view', 'create', 'edit', 'delete', 'approve'],
    reports: VIEW,
    masters: VIEW,
  },

  HR: {
    dashboard: VIEW,
    hr: ['view', 'create', 'edit', 'delete', 'approve'],
    reports: VIEW,
    masters: VIEW,
  },

  CLIENT: {
    portal: ['view', 'approve'],
  },
}

/**
 * Does `role` hold `action` on `module`?
 * @param {string|null|undefined} role
 * @param {string} module
 * @param {'view'|'create'|'edit'|'delete'|'approve'} [action]
 * @param {Record<string, Record<string, string[]>>} [matrix] override (admin UI preview)
 * @returns {boolean}
 */
export function can(role, module, action = 'view', matrix = permissions) {
  if (!role) return false
  const granted = matrix[role]?.[module]
  if (!granted) return false
  return granted.includes('*') || granted.includes(action)
}

/**
 * Filter the navigation tree down to what `role` may see.
 * @param {Array<object>} groups
 * @param {string|null|undefined} role
 * @returns {Array<object>}
 */
export function filterNavigation(groups, role) {
  return groups
    .map((group) => {
      if (!group.children) return can(role, group.module) ? group : null
      const children = group.children.filter((child) => can(role, child.module))
      return children.length > 0 ? { ...group, children } : null
    })
    .filter(Boolean)
}

import { createService } from './createService'
import { permissions as defaultPermissions } from '@/config/permissions'

export const userService = createService('users', {
  idPrefix: 'USR',
  searchFields: ['name', 'email', 'role', 'department', 'title'],
  defaultSort: { by: 'name', dir: 'asc' },
})

export const auditLogService = createService('auditLog', {
  idPrefix: 'AUD',
  searchFields: ['description', 'actorName', 'action', 'module', 'entity'],
  defaultSort: { by: 'at', dir: 'desc' },
})

const PERMISSIONS_KEY = 'apparelflow-permissions'
const SETTINGS_KEY = 'apparelflow-settings'

export const DEFAULT_SETTINGS = {
  companyName: 'ApparelFlow Sourcing Pvt Ltd',
  baseCurrency: 'INR',
  exportCurrency: 'USD',
  defaultIncoterm: 'FOB',
  defaultPaymentTerm: 'TT 45',
  defaultAql: '2.5',
  dateFormat: 'dd MMM yyyy',
  weekStart: 'monday',
  delayThresholdDays: 3,
  riskThresholdDays: 7,
  notifyOnSampleDecision: true,
  notifyOnStageDelay: true,
  notifyOnInvoiceOverdue: true,
  autoNumberOrders: true,
}

/**
 * The editable permission matrix. Overrides live in localStorage so the admin
 * screen can change RBAC for the session without touching the source config.
 * @returns {Record<string, Record<string, string[]>>}
 */
export function loadPermissionMatrix() {
  try {
    const raw = localStorage.getItem(PERMISSIONS_KEY)
    return raw ? JSON.parse(raw) : structuredClone(defaultPermissions)
  } catch {
    return structuredClone(defaultPermissions)
  }
}

/** @param {Record<string, Record<string, string[]>>} matrix */
export function savePermissionMatrix(matrix) {
  try {
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(matrix))
  } catch {
    // storage blocked — the change still applies for the current view
  }
  return matrix
}

export function resetPermissionMatrix() {
  try {
    localStorage.removeItem(PERMISSIONS_KEY)
  } catch {
    // ignore
  }
  return structuredClone(defaultPermissions)
}

/** @returns {typeof DEFAULT_SETTINGS} */
export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

/** @param {Partial<typeof DEFAULT_SETTINGS>} patch */
export function saveSettings(patch) {
  const next = { ...loadSettings(), ...patch }
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
  return next
}

/**
 * Append an audit entry. Called by the flows that change something meaningful.
 * @param {{action: string, module: string, entity: string, description: string,
 *   actorId?: string, actorName?: string, actorRole?: string}} entry
 */
export async function recordAudit(entry) {
  return auditLogService.create({
    ipAddress: '10.0.0.12',
    userAgent: 'Chrome 141 · macOS',
    at: new Date().toISOString(),
    ...entry,
  })
}

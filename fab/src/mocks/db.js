import meta from './data/meta.json'

import activities from './data/activities.json'
import allocations from './data/allocations.json'
import attendance from './data/attendance.json'
import auditLog from './data/auditLog.json'
import bills from './data/bills.json'
import categories from './data/categories.json'
import clientUpdates from './data/clientUpdates.json'
import clients from './data/clients.json'
import colors from './data/colors.json'
import company from './data/company.json'
import costSheets from './data/costSheets.json'
import currencies from './data/currencies.json'
import dailyOutput from './data/dailyOutput.json'
import defects from './data/defects.json'
import departments from './data/departments.json'
import designRequests from './data/designRequests.json'
import documents from './data/documents.json'
import employees from './data/employees.json'
import enquiries from './data/enquiries.json'
import expenses from './data/expenses.json'
import fabrics from './data/fabrics.json'
import grns from './data/grns.json'
import incoterms from './data/incoterms.json'
import inspections from './data/inspections.json'
import invoices from './data/invoices.json'
import leads from './data/leads.json'
import leaves from './data/leaves.json'
import materialPos from './data/materialPos.json'
import orders from './data/orders.json'
import payments from './data/payments.json'
import paymentTerms from './data/paymentTerms.json'
import payroll from './data/payroll.json'
import ports from './data/ports.json'
import productionStages from './data/productionStages.json'
import qcChecklists from './data/qcChecklists.json'
import quotations from './data/quotations.json'
import rfqs from './data/rfqs.json'
import samples from './data/samples.json'
import shipments from './data/shipments.json'
import sizeSets from './data/sizeSets.json'
import stages from './data/stages.json'
import techPacks from './data/techPacks.json'
import trims from './data/trims.json'
import uom from './data/uom.json'
import users from './data/users.json'
import vendorQuotes from './data/vendorQuotes.json'
import vendors from './data/vendors.json'

/** Every collection the mock API can serve, keyed by name. */
const SEED = {
  activities,
  allocations,
  attendance,
  auditLog,
  bills,
  categories,
  clientUpdates,
  clients,
  colors,
  company: [company],
  costSheets,
  currencies,
  dailyOutput,
  defects,
  departments,
  designRequests,
  documents,
  employees,
  enquiries,
  expenses,
  fabrics,
  grns,
  incoterms,
  inspections,
  invoices,
  leads,
  leaves,
  materialPos,
  orders,
  payments,
  paymentTerms,
  payroll,
  ports,
  productionStages,
  qcChecklists,
  quotations,
  rfqs,
  samples,
  shipments,
  sizeSets,
  stages,
  techPacks,
  trims,
  uom,
  users,
  vendorQuotes,
  vendors,
}

const STORAGE_PREFIX = 'apparelflow-db:'
const STORAGE_VERSION = `${meta.generatedAt}|2`
const DAY = 24 * 60 * 60 * 1000

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/

/**
 * The seed is anchored to `meta.generatedAt`. Shifting every date forward in
 * whole weeks keeps the demo current without moving weekday-sensitive data
 * (attendance, shift calendars) onto the wrong day of the week.
 */
const SHIFT_DAYS = (() => {
  const elapsed = Date.now() - new Date(meta.generatedAt).getTime()
  return Math.max(0, Math.floor(elapsed / DAY / 7) * 7)
})()

/**
 * @param {string} value ISO date or datetime
 * @returns {string} the same shape, shifted by SHIFT_DAYS
 */
function shiftDateString(value) {
  const shifted = new Date(new Date(value).getTime() + SHIFT_DAYS * DAY)
  return ISO_DATE.test(value) ? shifted.toISOString().slice(0, 10) : shifted.toISOString()
}

/**
 * Deep-clone a record, shifting any ISO date it contains.
 * @template T
 * @param {T} value
 * @returns {T}
 */
function shiftDates(value) {
  if (typeof value === 'string') {
    return ISO_DATE.test(value) || ISO_DATETIME.test(value) ? shiftDateString(value) : value
  }
  if (Array.isArray(value)) return value.map(shiftDates)
  if (value && typeof value === 'object') {
    const out = {}
    for (const [key, entry] of Object.entries(value)) out[key] = shiftDates(entry)
    return out
  }
  return value
}

/** In-memory working copy — the source of truth for the session. */
const store = new Map()

/** @param {string} name */
function storageKey(name) {
  return `${STORAGE_PREFIX}${name}`
}

/**
 * Read a collection's session overrides from localStorage, if they are current.
 * @param {string} name
 * @returns {Array<object>|null}
 */
function readPersisted(name) {
  try {
    const raw = localStorage.getItem(storageKey(name))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.version === STORAGE_VERSION ? parsed.rows : null
  } catch {
    return null
  }
}

/**
 * @param {string} name
 * @param {Array<object>} rows
 */
function writePersisted(name, rows) {
  try {
    localStorage.setItem(storageKey(name), JSON.stringify({ version: STORAGE_VERSION, rows }))
  } catch {
    // Quota or private mode — the session still works from memory.
  }
}

/**
 * Get the working copy of a collection, hydrating it on first access.
 * @param {keyof typeof SEED} name
 * @returns {Array<object>}
 */
export function table(name) {
  if (!SEED[name]) throw new Error(`Unknown collection "${name}"`)
  if (!store.has(name)) {
    store.set(name, readPersisted(name) ?? shiftDates(SEED[name]))
  }
  return store.get(name)
}

/**
 * Replace a collection and persist it for the rest of the session.
 * @param {keyof typeof SEED} name
 * @param {Array<object>} rows
 */
export function commit(name, rows) {
  store.set(name, rows)
  writePersisted(name, rows)
  return rows
}

/** Names of every available collection. */
export const collections = Object.keys(SEED)

/** Drop all session edits and go back to the shipped seed. */
export function resetDemoData() {
  store.clear()
  try {
    for (const name of collections) localStorage.removeItem(storageKey(name))
  } catch {
    // ignore
  }
}

/** True when the session has edits on top of the seed. */
export function hasLocalChanges() {
  try {
    return collections.some((name) => localStorage.getItem(storageKey(name)) !== null)
  } catch {
    return false
  }
}

export const dbMeta = { ...meta, shiftDays: SHIFT_DAYS, storageVersion: STORAGE_VERSION }

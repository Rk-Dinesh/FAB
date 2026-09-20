/**
 * Referential integrity check for the mock data set.
 * Every foreign key must resolve, and the CLAUDE.md volumes must hold.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'mocks', 'data')
const read = (name) => JSON.parse(readFileSync(join(DIR, name), 'utf8'))

const data = Object.fromEntries(
  [
    'users', 'clients', 'vendors', 'employees', 'departments', 'orders', 'leads', 'enquiries',
    'activities', 'designRequests', 'techPacks', 'samples', 'costSheets', 'quotations',
    'allocations', 'productionStages', 'dailyOutput', 'rfqs', 'vendorQuotes', 'materialPos',
    'grns', 'inspections', 'defects', 'shipments', 'documents', 'clientUpdates', 'invoices',
    'bills', 'payments', 'expenses', 'attendance', 'leaves', 'payroll', 'auditLog',
    'categories', 'fabrics', 'trims', 'colors', 'sizeSets', 'uom', 'currencies', 'ports',
    'incoterms', 'paymentTerms', 'qcChecklists', 'stages',
  ].map((name) => [name, read(`${name}.json`)]),
)

const idsOf = (rows) => new Set(rows.map((row) => row.id))
const sets = Object.fromEntries(Object.entries(data).map(([name, rows]) => [name, idsOf(rows)]))

const problems = []

/**
 * @param {string} collection
 * @param {string} field
 * @param {string} target
 * @param {boolean} [optional]
 */
function refs(collection, field, target, optional = true) {
  for (const row of data[collection]) {
    const value = row[field]
    if (value === null || value === undefined) {
      if (!optional) problems.push(`${collection}.${row.id}: ${field} is required`)
      continue
    }
    const values = Array.isArray(value) ? value : [value]
    for (const one of values) {
      if (!sets[target].has(one)) {
        problems.push(`${collection}.${row.id}: ${field}="${one}" has no ${target} record`)
      }
    }
  }
}

refs('users', 'employeeId', 'employees')
refs('users', 'clientId', 'clients')
refs('clients', 'accountManagerId', 'employees', false)
refs('clients', 'destinationPortId', 'ports', false)
refs('employees', 'departmentId', 'departments', false)
refs('employees', 'reportsTo', 'employees')
refs('departments', 'headEmployeeId', 'employees', false)
refs('orders', 'clientId', 'clients', false)
refs('orders', 'categoryId', 'categories', false)
refs('orders', 'fabricId', 'fabrics', false)
refs('orders', 'sizeSetId', 'sizeSets', false)
refs('orders', 'colorIds', 'colors', false)
refs('orders', 'merchandiserId', 'employees', false)
refs('orders', 'factoryVendorId', 'vendors')
refs('orders', 'destinationPortId', 'ports', false)
refs('leads', 'ownerId', 'employees', false)
refs('enquiries', 'clientId', 'clients', false)
refs('enquiries', 'orderId', 'orders')
refs('enquiries', 'ownerId', 'employees', false)
refs('designRequests', 'orderId', 'orders', false)
refs('designRequests', 'assignedToId', 'employees', false)
refs('techPacks', 'orderId', 'orders', false)
refs('samples', 'orderId', 'orders', false)
refs('samples', 'colorId', 'colors', false)
refs('costSheets', 'orderId', 'orders', false)
refs('costSheets', 'fabricId', 'fabrics', false)
refs('quotations', 'costSheetId', 'costSheets', false)
refs('quotations', 'orderId', 'orders', false)
refs('allocations', 'orderId', 'orders', false)
refs('allocations', 'vendorId', 'vendors', false)
refs('productionStages', 'orderId', 'orders', false)
refs('productionStages', 'vendorId', 'vendors', false)
refs('dailyOutput', 'orderId', 'orders', false)
refs('dailyOutput', 'vendorId', 'vendors', false)
refs('rfqs', 'orderId', 'orders', false)
refs('rfqs', 'invitedVendorIds', 'vendors', false)
refs('vendorQuotes', 'rfqId', 'rfqs', false)
refs('vendorQuotes', 'vendorId', 'vendors', false)
refs('materialPos', 'orderId', 'orders', false)
refs('materialPos', 'vendorId', 'vendors', false)
refs('grns', 'materialPoId', 'materialPos', false)
refs('grns', 'vendorId', 'vendors', false)
refs('inspections', 'orderId', 'orders', false)
refs('inspections', 'vendorId', 'vendors', false)
refs('inspections', 'checklistId', 'qcChecklists', false)
refs('defects', 'inspectionId', 'inspections', false)
refs('shipments', 'orderId', 'orders', false)
refs('shipments', 'destinationPortId', 'ports', false)
refs('documents', 'shipmentId', 'shipments', false)
refs('clientUpdates', 'orderId', 'orders', false)
refs('invoices', 'orderId', 'orders')
refs('invoices', 'clientId', 'clients', false)
refs('bills', 'materialPoId', 'materialPos', false)
refs('bills', 'vendorId', 'vendors', false)
refs('payments', 'invoiceId', 'invoices')
refs('payments', 'billId', 'bills')
refs('expenses', 'orderId', 'orders')
refs('attendance', 'employeeId', 'employees', false)
refs('leaves', 'employeeId', 'employees', false)
refs('payroll', 'employeeId', 'employees', false)
refs('auditLog', 'actorId', 'users', false)

// CLAUDE.md volume contract
const expect = (label, actual, wanted) => {
  if (actual !== wanted) problems.push(`volume: ${label} is ${actual}, expected ${wanted}`)
}
expect('clients', data.clients.length, 6)
expect('vendors', data.vendors.length, 25)
expect('orders', data.orders.length, 30)
expect('samples', data.samples.length, 60)
expect('employees', data.employees.length, 45)
expect('users', data.users.length, 12)

const delayed = data.orders.filter((order) => order.risk === 'DELAYED').length
if (delayed !== 8) problems.push(`volume: delayed orders is ${delayed}, expected 8`)
if (data.invoices.length + data.bills.length < 40) {
  problems.push(`volume: invoices+bills is ${data.invoices.length + data.bills.length}, expected at least 40`)
}

const statuses = new Set(data.orders.map((order) => order.status))
const FLOW = ['LEAD', 'ENQUIRY', 'DESIGN', 'COSTING', 'QUOTED', 'CONFIRMED', 'SAMPLING', 'SOURCING',
  'PRODUCTION', 'QC', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'PAYMENT_RECEIVED', 'CLOSED']
for (const status of FLOW) {
  if (!statuses.has(status)) problems.push(`volume: no order in status ${status}`)
}

// Unique ids within every collection
for (const [name, rows] of Object.entries(data)) {
  if (sets[name].size !== rows.length) problems.push(`${name}: duplicate ids (${rows.length - sets[name].size})`)
}

if (problems.length > 0) {
  console.log(`\n${problems.length} seed problem(s):\n`)
  for (const problem of problems.slice(0, 60)) console.log(`  ✗ ${problem}`)
  if (problems.length > 60) console.log(`  … and ${problems.length - 60} more`)
  console.log('')
  process.exit(1)
}

const total = Object.values(data).reduce((sum, rows) => sum + rows.length, 0)
console.log(`\nSeed check clean: ${Object.keys(data).length} collections, ${total} records, all references resolve.\n`)

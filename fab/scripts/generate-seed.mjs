/**
 * Regenerates every file under src/mocks/data from the modules in scripts/seed.
 *
 * The output is deterministic (a seeded PRNG), so re-running it produces the
 * same data set. Dates are written relative to REFERENCE_DATE; the runtime db
 * shifts them forward in whole weeks so the demo never looks stale.
 *
 *   npm run seed
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { rng, REFERENCE_DATE } from './seed/lib.mjs'
import { buildMasters } from './seed/masters.mjs'
import { buildClients, buildEmployees, buildVendors } from './seed/parties.mjs'
import { buildOrders } from './seed/orders.mjs'
import { buildCosting, buildCrm, buildDesign } from './seed/pipeline.mjs'
import { buildClientUpdates, buildLogistics, buildQuality, buildSourcing } from './seed/operations.mjs'
import { buildAuditLog, buildFinance, buildHr } from './seed/backoffice.mjs'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'mocks', 'data')
const random = rng(20260920)

const masters = buildMasters()
const clients = buildClients()
const vendors = buildVendors(random)
const employees = buildEmployees(random)
const { orders, productionStages, allocations, dailyOutput } = buildOrders(random, clients)
const { leads, enquiries, activities } = buildCrm(random, clients, orders)
const { designRequests, techPacks, samples } = buildDesign(random, orders)
const { costSheets, quotations } = buildCosting(random, orders, masters.fabrics)
const { rfqs, vendorQuotes, materialPos, grns } = buildSourcing(random, orders, masters.fabrics, masters.trims)
const { inspections, defects } = buildQuality(random, orders)
const { shipments, documents } = buildLogistics(random, orders, clients)
const clientUpdates = buildClientUpdates(random, orders, shipments)
const { invoices, bills, payments, expenses } = buildFinance(random, orders, materialPos, clients, vendors)
const { attendance, leaves, payroll } = buildHr(random, employees)

const users = JSON.parse(
  await import('node:fs').then(({ readFileSync }) => readFileSync(join(OUT_DIR, 'users.json'), 'utf8')),
)
const auditLog = buildAuditLog(random, users, orders, samples, invoices)

/** @type {Record<string, unknown>} */
const files = {
  // masters
  'company.json': masters.company,
  'categories.json': masters.categories,
  'fabrics.json': masters.fabrics,
  'trims.json': masters.trims,
  'colors.json': masters.colors,
  'sizeSets.json': masters.sizeSets,
  'uom.json': masters.uom,
  'currencies.json': masters.currencies,
  'ports.json': masters.ports,
  'incoterms.json': masters.incoterms,
  'paymentTerms.json': masters.paymentTerms,
  'qcChecklists.json': masters.qcChecklists,
  'departments.json': masters.departments,
  'stages.json': masters.stages,
  // parties
  'clients.json': clients,
  'vendors.json': vendors,
  'employees.json': employees,
  // crm
  'leads.json': leads,
  'enquiries.json': enquiries,
  'activities.json': activities,
  // design & costing
  'designRequests.json': designRequests,
  'techPacks.json': techPacks,
  'samples.json': samples,
  'costSheets.json': costSheets,
  'quotations.json': quotations,
  // orders & production
  'orders.json': orders,
  'allocations.json': allocations,
  'productionStages.json': productionStages,
  'dailyOutput.json': dailyOutput,
  // sourcing
  'rfqs.json': rfqs,
  'vendorQuotes.json': vendorQuotes,
  'materialPos.json': materialPos,
  'grns.json': grns,
  // quality
  'inspections.json': inspections,
  'defects.json': defects,
  // logistics
  'shipments.json': shipments,
  'documents.json': documents,
  'clientUpdates.json': clientUpdates,
  // finance
  'invoices.json': invoices,
  'bills.json': bills,
  'payments.json': payments,
  'expenses.json': expenses,
  // hr
  'attendance.json': attendance,
  'leaves.json': leaves,
  'payroll.json': payroll,
  // admin
  'auditLog.json': auditLog,
  // meta — read by the runtime to shift every date forward
  'meta.json': {
    generatedAt: REFERENCE_DATE.toISOString(),
    seed: 20260920,
    note: 'Dates are anchored to generatedAt; src/mocks/db.js shifts them in whole weeks at load.',
  },
}

mkdirSync(OUT_DIR, { recursive: true })
let totalRecords = 0
for (const [name, value] of Object.entries(files)) {
  writeFileSync(join(OUT_DIR, name), `${JSON.stringify(value, null, 2)}\n`)
  const count = Array.isArray(value) ? value.length : 1
  totalRecords += count
  console.log(`  ${name.padEnd(24)} ${String(count).padStart(6)} record(s)`)
}
console.log(`\n${Object.keys(files).length} files, ${totalRecords} records written to src/mocks/data\n`)

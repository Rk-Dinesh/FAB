/**
 * Service-layer contract check.
 *
 * Exercises createService (filter / sort / paginate / CRUD) and the domain
 * helpers against the real seed data, so a refactor of the mock API can't
 * silently break the screens that depend on it. Run with `npm run services`.
 */
import { loadReact, setupDom, setupVite } from './test-env.mjs'

const { window, container } = setupDom()
const vite = await setupVite()

const failures = []
/** @param {string} label @param {boolean} condition @param {string} [detail] */
const check = (label, condition, detail = '') => {
  if (condition) {
    console.log(`  ✓ ${label}`)
  } else {
    failures.push(`${label}${detail ? ` — ${detail}` : ''}`)
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

try {
  const services = await vite.ssrLoadModule('/src/services/index.js')
  const { dbMeta, resetDemoData } = await vite.ssrLoadModule('/src/mocks/db.js')
  const { ORDER_STATUS_FLOW } = await vite.ssrLoadModule('/src/config/statuses.js')

  console.log(`\nDate shift applied: ${dbMeta.shiftDays} day(s)\n`)

  // --- createService contract ---
  const page1 = await services.orderService.getAll({ page: 1, pageSize: 10, sortBy: 'orderValue', sortDir: 'desc' })
  check('getAll paginates', page1.rows.length === 10 && page1.total === 30 && page1.pageCount === 3)
  check('getAll sorts desc', page1.rows[0].orderValue >= page1.rows[9].orderValue)

  const filtered = await services.orderService.getAll({ filters: { status: 'PRODUCTION' } })
  check('getAll filters by value', filtered.rows.every((row) => row.status === 'PRODUCTION') && filtered.total === 4,
    `got ${filtered.total}`)

  const multi = await services.orderService.getAll({ filters: { status: ['QC', 'SHIPPED'] } })
  check('getAll filters by array', multi.total === 4, `got ${multi.total}`)

  const searched = await services.orderService.getAll({ search: 'northwind' })
  check('getAll searches', searched.total > 0 && searched.rows.every((row) => /northwind/i.test(row.clientName)))

  const one = await services.orderService.getById('ORD-017')
  check('getById resolves', one?.id === 'ORD-017')
  check('getById misses cleanly', (await services.orderService.getById('ORD-999')) === null)

  const created = await services.leadService.create({ company: 'Contract Test Co', stage: 'NEW', ownerId: 'EMP-005' })
  check('create assigns an id', /^LED-\d+$/.test(created.id))
  const updated = await services.leadService.update(created.id, { stage: 'QUALIFIED' })
  check('update patches', updated.stage === 'QUALIFIED')
  await services.leadService.remove(created.id)
  check('remove deletes', (await services.leadService.getById(created.id)) === null)

  // --- domain helpers ---
  const order360 = await services.getOrder360('ORD-019')
  check('getOrder360 joins relations',
    Boolean(order360?.client && order360.fabric && order360.productionStages.length > 0 && order360.colors.length > 0))

  const matrix = services.buildSizeMatrix(order360)
  const matrixTotal = Object.values(matrix.columnTotals).reduce((sum, value) => sum + value, 0)
  check('size matrix totals agree', matrixTotal === matrix.grandTotal && matrix.grandTotal === order360.quantity,
    `${matrixTotal} vs ${matrix.grandTotal} vs ${order360.quantity}`)

  const summary = await services.getOrderStatusSummary()
  check('status summary covers the flow',
    summary.length === ORDER_STATUS_FLOW.length && summary.reduce((sum, row) => sum + row.count, 0) === 30)

  const fob = services.calculateFob({ fabric: 2, trims: 0.5, cm: 1.2, wash: 0.3, overhead: 0.4, freight: 0.1 }, 20)
  check('calculateFob applies margin', fob.subtotal === 4.5 && fob.fobPrice === 5.63, `got ${fob.fobPrice}`)
  check('marginFromPrice inverts it', services.marginFromPrice(4.5, 5.63) === 20.1, `got ${services.marginFromPrice(4.5, 5.63)}`)

  const plan = services.aqlPlan(12000)
  check('aqlPlan reads the AQL 2.5 table', plan.sampleSize === 315 && plan.acceptOn === 14 && plan.rejectOn === 15,
    JSON.stringify(plan))

  const tracker = await services.getStageTracker()
  check('stage tracker groups by order', tracker.length > 0 && tracker.every((group) => group.stages.length >= 6))
  check('stage tracker computes completion',
    tracker.every((group) => group.completionPercent >= 0 && group.completionPercent <= 100))

  const alerts = await services.getDelayAlerts()
  check('delay alerts surface late stages', alerts.length > 0)

  const comparison = await services.getQuoteComparison('RFQ-001')
  check('quote comparison marks the best price',
    comparison.quotes.filter((quote) => quote.isBestPrice).length === 1 && comparison.quotes.length === 3)

  const aging = await services.getReceivablesAging()
  const bucketTotal = aging.buckets.reduce((sum, bucket) => sum + bucket.amount, 0)
  check('receivables aging reconciles', Math.abs(bucketTotal - aging.total) < 1,
    `${bucketTotal} vs ${aging.total}`)

  const pnl = await services.getOrderPnl()
  check('order P&L covers confirmed orders', pnl.length === 20, `got ${pnl.length}`)
  check('order P&L margin is consistent',
    pnl.every((row) => Math.abs(row.revenue - row.cost - row.grossMargin) < 1))

  const quality = await services.getQualitySummary()
  check('quality summary counts inspections', quality.total > 0 && quality.passRate >= 0 && quality.passRate <= 100)

  const pareto = await services.getDefectPareto()
  check('defect pareto sorts worst first',
    pareto.length > 0 && pareto.every((row, index) => index === 0 || pareto[index - 1].quantity >= row.quantity))

  const headcount = await services.getHeadcount()
  check('headcount totals 45', headcount.total === 45)

  const attendance = await services.getAttendanceMonth(new Date().toISOString().slice(0, 7))
  check('attendance month returns days', attendance.length > 0 && attendance[0].rows.length > 0)

  const finance = await services.getFinanceSummary()
  check('finance summary computes receivables', finance.receivables >= 0 && finance.revenueYtd > 0)

  const vendorPerf = await services.getVendorPerformance()
  check('vendor performance covers 25 vendors', vendorPerf.length === 25)

  resetDemoData()
  check('resetDemoData restores the seed', (await services.leadService.getAll()).total === 18)
} finally {
  await vite.close()
}

if (failures.length > 0) {
  console.log(`\n${failures.length} service check(s) failed.\n`)
  process.exit(1)
}
console.log('\nService layer contract holds.\n')

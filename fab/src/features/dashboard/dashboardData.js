import { table } from '@/mocks/db'
import { ORDER_STATUS_FLOW, ORDER_STATUSES } from '@/config/statuses'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** @param {number} value */
const round = (value) => Math.round(value * 100) / 100

/**
 * Everything the CXO dashboard shows, assembled from the mock db in one pass.
 * Kept out of the component so `npm run services` can assert the numbers.
 *
 * @returns {Promise<object>}
 */
export async function getExecutiveSummary() {
  // A small delay keeps the dashboard's loading states honest.
  await new Promise((resolve) => setTimeout(resolve, 380))

  const orders = table('orders')
  const invoices = table('invoices')
  const clients = table('clients')
  const employees = table('employees')
  const vendors = table('vendors')
  const stages = table('productionStages')
  const inspections = table('inspections')

  const live = orders.filter((order) => order.statusIndex >= 5 && order.statusIndex < 14)
  const shipped = orders.filter((order) => order.statusIndex >= 11)
  const onTime = shipped.filter((order) => order.delayDays === 0)

  const today = new Date()
  const thisMonth = today.toISOString().slice(0, 7)
  const thisYear = String(today.getFullYear())

  const revenueMtd = invoices
    .filter((invoice) => invoice.issuedAt.startsWith(thisMonth))
    .reduce((sum, invoice) => sum + invoice.amount, 0)
  const revenueYtd = invoices
    .filter((invoice) => invoice.issuedAt.startsWith(thisYear))
    .reduce((sum, invoice) => sum + invoice.amount, 0)

  // Monthly revenue against a target, for the trailing 12 months.
  const monthly = []
  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - offset, 1))
    const key = date.toISOString().slice(0, 7)
    const revenue = invoices
      .filter((invoice) => invoice.issuedAt.startsWith(key))
      .reduce((sum, invoice) => sum + invoice.amount, 0)
    monthly.push({
      month: key,
      label: `${MONTH_LABELS[date.getUTCMonth()]} ${String(date.getUTCFullYear()).slice(2)}`,
      revenue: round(revenue),
      // A flat quarterly-stepped target, which is how the board sets it.
      target: 1_650_000 + Math.floor((11 - offset) / 3) * 120_000,
    })
  }

  const byStatus = ORDER_STATUS_FLOW.map((status) => {
    const matching = orders.filter((order) => order.status === status)
    return {
      status,
      label: ORDER_STATUSES[status].label,
      count: matching.length,
      value: round(matching.reduce((sum, order) => sum + order.orderValue, 0)),
    }
  })

  const topClients = clients
    .map((client) => {
      const clientOrders = orders.filter((order) => order.clientId === client.id)
      const clientInvoices = invoices.filter((invoice) => invoice.clientId === client.id)
      return {
        id: client.id,
        name: client.name,
        country: client.country,
        orders: clientOrders.length,
        value: round(clientOrders.reduce((sum, order) => sum + order.orderValue, 0)),
        outstanding: round(clientInvoices.reduce((sum, invoice) => sum + invoice.balance, 0)),
      }
    })
    .sort((left, right) => right.value - left.value)

  const vendorPerformance = vendors
    .filter((vendor) => stages.some((stage) => stage.vendorId === vendor.id))
    .map((vendor) => {
      const vendorStages = stages.filter((stage) => stage.vendorId === vendor.id)
      const vendorInspections = inspections.filter((entry) => entry.vendorId === vendor.id)
      const passed = vendorInspections.filter((entry) => entry.result === 'PASS').length
      return {
        id: vendor.id,
        name: vendor.name,
        onTimePercent: vendor.onTimePercent,
        defectRatePercent: vendor.defectRatePercent,
        delayedStages: vendorStages.filter((stage) => stage.status === 'DELAYED').length,
        passRate:
          vendorInspections.length > 0
            ? round((passed / vendorInspections.length) * 100)
            : null,
      }
    })
    .sort((left, right) => right.onTimePercent - left.onTimePercent)

  const delayed = orders
    .filter((order) => order.risk === 'DELAYED')
    .map((order) => ({
      id: order.id,
      poNumber: order.poNumber,
      clientName: order.clientName,
      styleName: order.styleName,
      status: order.status,
      delayDays: order.delayDays,
      exFactoryDate: order.revisedExFactoryDate ?? order.exFactoryDate,
      orderValue: order.orderValue,
    }))
    .sort((left, right) => right.delayDays - left.delayDays)

  // Gross margin across costed orders, from the same maths as the P&L page.
  const costSheets = table('costSheets')
  const marginOrders = orders.filter((order) => order.statusIndex >= 5)
  const marginRevenue = marginOrders.reduce((sum, order) => sum + order.orderValue, 0)
  const marginCost = marginOrders.reduce((sum, order) => {
    const sheet = costSheets.find((entry) => entry.orderId === order.id)
    return sum + (sheet ? sheet.subtotal * order.quantity : order.orderValue * 0.84)
  }, 0)

  const headcount = employees.reduce((accumulator, employee) => {
    accumulator[employee.department] = (accumulator[employee.department] ?? 0) + 1
    return accumulator
  }, {})

  return {
    orderBookValue: round(live.reduce((sum, order) => sum + order.orderValue, 0)),
    orderBookUnits: live.reduce((sum, order) => sum + order.quantity, 0),
    liveOrders: live.length,
    revenueMtd: round(revenueMtd),
    revenueYtd: round(revenueYtd),
    grossMarginPercent:
      marginRevenue > 0 ? round(((marginRevenue - marginCost) / marginRevenue) * 100) : 0,
    onTimePercent: shipped.length > 0 ? round((onTime.length / shipped.length) * 100) : 0,
    receivables: round(invoices.reduce((sum, invoice) => sum + invoice.balance, 0)),
    overdueInvoices: invoices.filter((invoice) => invoice.status === 'OVERDUE').length,
    monthly,
    byStatus,
    topClients,
    vendorPerformance,
    delayed,
    headcount: Object.entries(headcount)
      .map(([department, count]) => ({ department, count }))
      .sort((left, right) => right.count - left.count),
    headcountTotal: employees.length,
  }
}

/**
 * The "needs attention" queue for one role — what that person should act on today.
 * @param {string} role
 * @returns {Promise<{kpis: Array<object>, tasks: Array<object>}>}
 */
export async function getRoleDashboard(role) {
  await new Promise((resolve) => setTimeout(resolve, 340))

  const orders = table('orders')
  const samples = table('samples')
  const stages = table('productionStages')
  const materialPos = table('materialPos')
  const inspections = table('inspections')
  const shipments = table('shipments')
  const invoices = table('invoices')
  const leaves = table('leaves')
  const rfqs = table('rfqs')

  /** @type {Array<{id: string, title: string, detail: string, tone: string, to: string}>} */
  const tasks = []
  /** @type {Array<{label: string, value: number|string, tone: string, hint?: string}>} */
  const kpis = []

  const pendingSamples = samples.filter((sample) => sample.status === 'PENDING')
  const delayedStages = stages.filter((stage) => stage.status === 'DELAYED')
  const openPos = materialPos.filter((po) => po.status === 'ISSUED')
  const failedInspections = inspections.filter((entry) => entry.result === 'FAIL')
  const overdueInvoices = invoices.filter((invoice) => invoice.status === 'OVERDUE')
  const delayedOrders = orders.filter((order) => order.risk === 'DELAYED')
  const atRiskOrders = orders.filter((order) => order.risk === 'AT_RISK')

  if (['MERCHANDISER', 'SUPER_ADMIN', 'CXO'].includes(role)) {
    kpis.push(
      { label: 'Live orders', value: orders.filter((order) => order.statusIndex >= 5 && order.statusIndex < 14).length, tone: 'primary' },
      { label: 'Delayed', value: delayedOrders.length, tone: 'danger' },
      { label: 'At risk', value: atRiskOrders.length, tone: 'warning' },
      { label: 'Samples pending', value: pendingSamples.length, tone: 'info' },
    )
    for (const order of delayedOrders.slice(0, 5)) {
      tasks.push({
        id: `delay-${order.id}`,
        title: `${order.poNumber} is ${order.delayDays} days behind`,
        detail: `${order.clientName} · ${order.styleName} · tell the brand and confirm the revised date`,
        tone: 'danger',
        to: `/app/orders/${order.id}`,
      })
    }
  }

  if (['DESIGNER', 'SUPER_ADMIN'].includes(role)) {
    kpis.push(
      { label: 'Samples pending', value: pendingSamples.length, tone: 'warning' },
      { label: 'Rejected samples', value: samples.filter((sample) => sample.status === 'REJECTED').length, tone: 'danger' },
      { label: 'Tech packs in review', value: table('techPacks').filter((pack) => pack.status === 'IN_REVIEW').length, tone: 'info' },
      { label: 'Open design requests', value: table('designRequests').filter((entry) => entry.status !== 'COMPLETED').length, tone: 'primary' },
    )
    for (const sample of pendingSamples.slice(0, 5)) {
      tasks.push({
        id: `sample-${sample.id}`,
        title: `${sample.type.replace('_', ' ')} sample ${sample.reference} awaiting a decision`,
        detail: `${sample.clientName} · ${sample.styleName} · due ${sample.dueAt}`,
        tone: 'warning',
        to: '/app/design/samples',
      })
    }
  }

  if (['SOURCING', 'SUPER_ADMIN'].includes(role)) {
    kpis.push(
      { label: 'Open material POs', value: openPos.length, tone: 'warning' },
      { label: 'RFQs awaiting quotes', value: rfqs.filter((rfq) => rfq.status === 'ISSUED').length, tone: 'primary' },
      { label: 'Short receipts', value: table('grns').filter((grn) => grn.shortfallQuantity > 0).length, tone: 'danger' },
      { label: 'Vendors under review', value: table('vendors').filter((vendor) => vendor.onTimePercent < 82).length, tone: 'info' },
    )
    for (const po of openPos.slice(0, 5)) {
      tasks.push({
        id: `po-${po.id}`,
        title: `${po.reference} still open with ${po.materialName}`,
        detail: `${po.poNumber} · expected ${po.expectedAt}`,
        tone: 'warning',
        to: '/app/sourcing/material-po',
      })
    }
  }

  if (['PRODUCTION', 'SUPER_ADMIN'].includes(role)) {
    kpis.push(
      { label: 'Delayed stages', value: delayedStages.length, tone: 'danger' },
      { label: 'Orders on the floor', value: new Set(stages.map((stage) => stage.orderId)).size, tone: 'primary' },
      { label: 'Stages in progress', value: stages.filter((stage) => stage.status === 'IN_PROGRESS').length, tone: 'info' },
      { label: 'Units to complete', value: stages.reduce((sum, stage) => sum + (stage.quantityPlanned - stage.quantityDone), 0), tone: 'warning' },
    )
    for (const stage of delayedStages.slice(0, 5)) {
      tasks.push({
        id: `stage-${stage.id}`,
        title: `${stage.stage.replace(/_/g, ' ').toLowerCase()} is behind on ${stage.poNumber}`,
        detail: `${stage.clientName} · ${stage.delayDays} days late · ${stage.quantityDone}/${stage.quantityPlanned} pcs`,
        tone: 'danger',
        to: '/app/production/tracker',
      })
    }
  }

  if (['QC', 'SUPER_ADMIN'].includes(role)) {
    kpis.push(
      { label: 'Failed inspections', value: failedInspections.length, tone: 'danger' },
      { label: 'Open defects', value: table('defects').filter((defect) => defect.status === 'OPEN').length, tone: 'warning' },
      { label: 'Inspections recorded', value: inspections.length, tone: 'primary' },
      {
        label: 'Pass rate',
        value: inspections.length > 0
          ? `${round(((inspections.length - failedInspections.length) / inspections.length) * 100)}%`
          : '—',
        tone: 'success',
      },
    )
    for (const inspection of failedInspections.slice(0, 5)) {
      tasks.push({
        id: `inspection-${inspection.id}`,
        title: `${inspection.reference} failed — re-offer required`,
        detail: `${inspection.poNumber} · ${inspection.defectsFound} defects against an accept-on of ${inspection.acceptOn}`,
        tone: 'danger',
        to: '/app/quality/inspections',
      })
    }
  }

  if (['LOGISTICS', 'SUPER_ADMIN'].includes(role)) {
    const readyToShip = orders.filter((order) => order.status === 'READY_TO_SHIP')
    kpis.push(
      { label: 'Ready to ship', value: readyToShip.length, tone: 'warning' },
      { label: 'In transit', value: shipments.filter((entry) => entry.status === 'IN_TRANSIT').length, tone: 'primary' },
      { label: 'Draft documents', value: table('documents').filter((entry) => entry.status === 'DRAFT').length, tone: 'info' },
      { label: 'Arriving this week', value: shipments.filter((entry) => entry.status === 'IN_TRANSIT').length, tone: 'success' },
    )
    for (const order of readyToShip.slice(0, 5)) {
      tasks.push({
        id: `ship-${order.id}`,
        title: `${order.poNumber} is packed and awaiting a booking`,
        detail: `${order.clientName} · ex-factory ${order.revisedExFactoryDate ?? order.exFactoryDate}`,
        tone: 'warning',
        to: '/app/logistics/shipments',
      })
    }
  }

  if (['FINANCE', 'SUPER_ADMIN', 'CXO'].includes(role)) {
    kpis.push(
      { label: 'Overdue invoices', value: overdueInvoices.length, tone: 'danger' },
      {
        label: 'Receivables',
        value: `$${Math.round(invoices.reduce((sum, invoice) => sum + invoice.balance, 0) / 1000)}k`,
        tone: 'warning',
      },
      { label: 'Bills due', value: table('bills').filter((bill) => bill.status !== 'PAID').length, tone: 'info' },
      { label: 'Expenses to approve', value: table('expenses').filter((entry) => entry.status === 'SUBMITTED').length, tone: 'primary' },
    )
    for (const invoice of overdueInvoices.slice(0, 5)) {
      tasks.push({
        id: `invoice-${invoice.id}`,
        title: `${invoice.number} is ${invoice.agingDays} days overdue`,
        detail: `${invoice.clientName} · $${Math.round(invoice.balance).toLocaleString('en-US')} outstanding`,
        tone: 'danger',
        to: '/app/finance/invoices',
      })
    }
  }

  if (['HR', 'SUPER_ADMIN'].includes(role)) {
    const pendingLeave = leaves.filter((leave) => leave.status === 'PENDING')
    kpis.push(
      { label: 'Leave to approve', value: pendingLeave.length, tone: 'warning' },
      { label: 'Headcount', value: table('employees').length, tone: 'primary' },
      { label: 'On contract', value: table('employees').filter((employee) => employee.employmentType === 'CONTRACT').length, tone: 'info' },
      { label: 'Departments', value: table('departments').length, tone: 'success' },
    )
    for (const leave of pendingLeave.slice(0, 5)) {
      tasks.push({
        id: `leave-${leave.id}`,
        title: `${leave.employeeName} has applied for ${leave.days} day${leave.days === 1 ? '' : 's'}`,
        detail: `${leave.type.toLowerCase()} leave · ${leave.fromDate} to ${leave.toDate}`,
        tone: 'warning',
        to: '/app/hr/leave',
      })
    }
  }

  return { kpis: kpis.slice(0, 4), tasks: tasks.slice(0, 8) }
}

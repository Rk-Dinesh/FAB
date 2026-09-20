import { createService } from './createService'
import { table } from '@/mocks/db'

export const invoiceService = createService('invoices', {
  idPrefix: 'INV',
  searchFields: ['number', 'poNumber', 'clientName', 'status'],
  defaultSort: { by: 'issuedAt', dir: 'desc' },
})

export const billService = createService('bills', {
  idPrefix: 'BIL',
  searchFields: ['number', 'poNumber', 'vendorName', 'status'],
  defaultSort: { by: 'issuedAt', dir: 'desc' },
})

export const paymentService = createService('payments', {
  idPrefix: 'PMT',
  searchFields: ['reference', 'partyName', 'method', 'bankReference'],
  defaultSort: { by: 'paidAt', dir: 'desc' },
})

export const expenseService = createService('expenses', {
  idPrefix: 'EXP',
  searchFields: ['reference', 'head', 'category', 'poNumber'],
  defaultSort: { by: 'incurredAt', dir: 'desc' },
})

const AGING_BUCKETS = [
  { key: 'current', label: 'Not due', min: -Infinity, max: 0 },
  { key: 'd1_30', label: '1–30 days', min: 1, max: 30 },
  { key: 'd31_60', label: '31–60 days', min: 31, max: 60 },
  { key: 'd61_90', label: '61–90 days', min: 61, max: 90 },
  { key: 'd90_plus', label: '90+ days', min: 91, max: Infinity },
]

/**
 * Receivables aging across the open invoices.
 * @returns {Promise<{buckets: Array<object>, total: number}>}
 */
export async function getReceivablesAging() {
  const invoices = await invoiceService.list()
  const open = invoices.filter((invoice) => invoice.balance > 0)
  const today = new Date().toISOString().slice(0, 10)

  const buckets = AGING_BUCKETS.map((bucket) => ({ ...bucket, amount: 0, count: 0, clients: new Set() }))
  for (const invoice of open) {
    const overdueDays = Math.round(
      (new Date(today).getTime() - new Date(invoice.dueAt).getTime()) / 86400000,
    )
    const bucket = buckets.find((entry) => overdueDays >= entry.min && overdueDays <= entry.max)
    if (!bucket) continue
    bucket.amount += invoice.balance
    bucket.count += 1
    bucket.clients.add(invoice.clientName)
  }

  return {
    buckets: buckets.map(({ clients, ...bucket }) => ({
      ...bucket,
      amount: round(bucket.amount),
      clientCount: clients.size,
    })),
    total: round(open.reduce((sum, invoice) => sum + invoice.balance, 0)),
  }
}

/**
 * Order-wise P&L: revenue against material, CMT, freight and overhead.
 * @param {string} [orderId] one order, or every costed order when omitted
 */
export async function getOrderPnl(orderId) {
  const orders = table('orders').filter((order) =>
    orderId ? order.id === orderId : order.statusIndex >= 5,
  )
  const materialPos = table('materialPos')
  const expenses = table('expenses')
  const shipments = table('shipments')
  const costSheets = table('costSheets')
  const invoices = table('invoices')

  const rows = orders.map((order) => {
    const revenue = order.orderValue
    const material = materialPos
      .filter((entry) => entry.orderId === order.id)
      .reduce((sum, entry) => sum + entry.totalValue, 0)
    const sheet = costSheets.find((entry) => entry.orderId === order.id)
    const cmt = ((sheet?.lines?.cm ?? 0) + (sheet?.lines?.wash ?? 0)) * order.quantity
    const freight =
      shipments
        .filter((entry) => entry.orderId === order.id)
        .reduce((sum, entry) => sum + entry.freightCostUsd, 0) ||
      (sheet?.lines?.freight ?? 0) * order.quantity
    const overhead =
      expenses
        .filter((entry) => entry.orderId === order.id)
        .reduce((sum, entry) => sum + entry.amountUsd, 0) +
      (sheet?.lines?.overhead ?? 0) * order.quantity
    const cost = material + cmt + freight + overhead
    const invoiced = invoices
      .filter((entry) => entry.orderId === order.id)
      .reduce((sum, entry) => sum + entry.amount, 0)
    const received = invoices
      .filter((entry) => entry.orderId === order.id)
      .reduce((sum, entry) => sum + entry.receivedAmount, 0)

    return {
      id: order.id,
      orderId: order.id,
      poNumber: order.poNumber,
      clientName: order.clientName,
      styleName: order.styleName,
      status: order.status,
      quantity: order.quantity,
      revenue: round(revenue),
      material: round(material),
      cmt: round(cmt),
      freight: round(freight),
      overhead: round(overhead),
      cost: round(cost),
      grossMargin: round(revenue - cost),
      marginPercent: revenue > 0 ? Number((((revenue - cost) / revenue) * 100).toFixed(1)) : 0,
      invoiced: round(invoiced),
      received: round(received),
      outstanding: round(invoiced - received),
    }
  })

  return orderId ? (rows[0] ?? null) : rows
}

/** Headline finance numbers for the CXO dashboard. */
export async function getFinanceSummary() {
  const invoices = await invoiceService.list()
  const bills = await billService.list()
  const thisYear = new Date().getFullYear()

  const revenueYtd = invoices
    .filter((invoice) => new Date(invoice.issuedAt).getFullYear() === thisYear)
    .reduce((sum, invoice) => sum + invoice.amount, 0)
  const month = new Date().toISOString().slice(0, 7)
  const revenueMtd = invoices
    .filter((invoice) => invoice.issuedAt.startsWith(month))
    .reduce((sum, invoice) => sum + invoice.amount, 0)

  return {
    revenueYtd: round(revenueYtd),
    revenueMtd: round(revenueMtd),
    receivables: round(invoices.reduce((sum, invoice) => sum + invoice.balance, 0)),
    payables: round(bills.reduce((sum, bill) => sum + bill.balance, 0)),
    overdueCount: invoices.filter((invoice) => invoice.status === 'OVERDUE').length,
  }
}

function round(value) {
  return Math.round(value * 100) / 100
}

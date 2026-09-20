import { createService } from './createService'
import { table } from '@/mocks/db'
import { ORDER_STATUS_FLOW } from '@/config/statuses'

export const orderService = createService('orders', {
  idPrefix: 'ORD',
  searchFields: ['poNumber', 'clientPoNumber', 'clientName', 'styleName', 'styleNumber', 'status'],
  defaultSort: { by: 'exFactoryDate', dir: 'asc' },
})

/**
 * Everything the Order 360 page needs, resolved in one call.
 * @param {string} orderId
 * @returns {Promise<object|null>}
 */
export async function getOrder360(orderId) {
  const order = await orderService.getById(orderId)
  if (!order) return null

  const where = (collection, field = 'orderId') =>
    table(collection).filter((row) => row[field] === orderId)

  const client = table('clients').find((row) => row.id === order.clientId) ?? null
  const shipment = where('shipments')[0] ?? null

  return {
    ...order,
    client,
    category: table('categories').find((row) => row.id === order.categoryId) ?? null,
    fabric: table('fabrics').find((row) => row.id === order.fabricId) ?? null,
    sizeSet: table('sizeSets').find((row) => row.id === order.sizeSetId) ?? null,
    colors: table('colors').filter((row) => order.colorIds.includes(row.id)),
    merchandiser: table('employees').find((row) => row.id === order.merchandiserId) ?? null,
    factory: table('vendors').find((row) => row.id === order.factoryVendorId) ?? null,
    destinationPort: table('ports').find((row) => row.id === order.destinationPortId) ?? null,
    samples: where('samples'),
    designRequests: where('designRequests'),
    techPacks: where('techPacks'),
    costSheets: where('costSheets'),
    quotations: where('quotations'),
    materialPos: where('materialPos'),
    grns: where('grns'),
    rfqs: where('rfqs'),
    allocations: where('allocations'),
    productionStages: where('productionStages').sort((a, b) => a.sequence - b.sequence),
    dailyOutput: where('dailyOutput'),
    inspections: where('inspections'),
    defects: where('defects'),
    shipment,
    shipments: where('shipments'),
    documents: where('documents'),
    clientUpdates: where('clientUpdates'),
    invoices: where('invoices'),
    bills: where('bills'),
    expenses: where('expenses'),
    activities: table('activities').filter(
      (row) => row.entity === 'order' && row.entityId === orderId,
    ),
  }
}

/**
 * Advance an order one step along the lifecycle.
 * @param {string} orderId
 * @param {string} status
 */
export async function setOrderStatus(orderId, status) {
  const statusIndex = ORDER_STATUS_FLOW.indexOf(status)
  if (statusIndex === -1) throw new Error(`Unknown order status "${status}"`)
  return orderService.update(orderId, { status, statusIndex })
}

/**
 * Counts per lifecycle status, for the funnel and the list filters.
 * @returns {Promise<Array<{status: string, count: number, value: number}>>}
 */
export async function getOrderStatusSummary() {
  const orders = await orderService.list()
  return ORDER_STATUS_FLOW.map((status) => {
    const matching = orders.filter((order) => order.status === status)
    return {
      status,
      count: matching.length,
      value: matching.reduce((sum, order) => sum + order.orderValue, 0),
    }
  })
}

/**
 * A colour × size grid totalled both ways, for the size matrix tab.
 * @param {object} order
 */
export function buildSizeMatrix(order) {
  const sizeSet = table('sizeSets').find((row) => row.id === order.sizeSetId)
  const sizes = sizeSet?.sizes ?? []
  const colorById = Object.fromEntries(table('colors').map((row) => [row.id, row]))
  const rows = order.sizeMatrix.map((row) => ({
    ...row,
    // hex null → the swatch falls back to a themed placeholder rather than a fixed grey.
    color: colorById[row.colorId] ?? { id: row.colorId, name: row.colorId, hex: null },
  }))
  const columnTotals = Object.fromEntries(
    sizes.map((size) => [size, rows.reduce((sum, row) => sum + (row.sizes[size] ?? 0), 0)]),
  )
  return {
    sizes,
    rows,
    columnTotals,
    grandTotal: rows.reduce((sum, row) => sum + row.total, 0),
  }
}

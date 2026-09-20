import { createService } from './createService'
import { table } from '@/mocks/db'

export const shipmentService = createService('shipments', {
  idPrefix: 'SHP',
  searchFields: ['reference', 'poNumber', 'clientName', 'blNumber', 'containerNumber', 'carrier'],
  defaultSort: { by: 'etd', dir: 'desc' },
})

export const documentService = createService('documents', {
  idPrefix: 'DOC',
  searchFields: ['name', 'number', 'poNumber', 'clientName', 'type'],
  defaultSort: { by: 'issuedAt', dir: 'desc' },
})

/**
 * One shipment with its documents and resolved ports.
 * @param {string} shipmentId
 */
export async function getShipmentDetail(shipmentId) {
  const shipment = await shipmentService.getById(shipmentId)
  if (!shipment) return null
  const portById = Object.fromEntries(table('ports').map((row) => [row.id, row]))
  return {
    ...shipment,
    originPort: portById[shipment.originPortId] ?? null,
    destinationPort: portById[shipment.destinationPortId] ?? null,
    documents: table('documents').filter((row) => row.shipmentId === shipmentId),
    order: table('orders').find((row) => row.id === shipment.orderId) ?? null,
  }
}

/** Shipments still moving, soonest arrival first. */
export async function getActiveShipments(clientId) {
  const rows = await shipmentService.list({
    filters: { status: ['BOOKED', 'IN_TRANSIT', 'ARRIVED'], ...(clientId ? { clientId } : {}) },
  })
  return rows.sort((left, right) => left.eta.localeCompare(right.eta))
}

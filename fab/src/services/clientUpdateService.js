import { createService } from './createService'

export const clientUpdateService = createService('clientUpdates', {
  idPrefix: 'CUP',
  searchFields: ['subject', 'body', 'poNumber', 'clientName', 'area'],
  defaultSort: { by: 'sentAt', dir: 'desc' },
})

/**
 * Send an update to a brand about one order.
 * @param {{orderId: string, poNumber: string, clientId: string, clientName: string,
 *   area: string, subject: string, body: string, channel?: string, sentById: string}} update
 */
export async function sendClientUpdate(update) {
  return clientUpdateService.create({
    channel: 'EMAIL',
    acknowledged: false,
    sentAt: new Date().toISOString(),
    ...update,
  })
}

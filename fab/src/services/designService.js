import { createService } from './createService'

export const designRequestService = createService('designRequests', {
  idPrefix: 'DSR',
  searchFields: ['reference', 'clientName', 'styleName', 'brief'],
  defaultSort: { by: 'raisedAt', dir: 'desc' },
})

export const techPackService = createService('techPacks', {
  idPrefix: 'TPK',
  searchFields: ['reference', 'clientName', 'styleName'],
  defaultSort: { by: 'updatedAt', dir: 'desc' },
})

export const sampleService = createService('samples', {
  idPrefix: 'SMP',
  searchFields: ['reference', 'clientName', 'styleName', 'type', 'poNumber'],
  defaultSort: { by: 'sentAt', dir: 'desc' },
})

/**
 * Record a client's decision on a sample.
 * @param {string} sampleId
 * @param {'APPROVED'|'REJECTED'} status
 * @param {string} comments
 * @param {'CLIENT'|'INTERNAL'} [decidedBy]
 */
export async function decideSample(sampleId, status, comments, decidedBy = 'CLIENT') {
  return sampleService.update(sampleId, {
    status,
    comments,
    decidedBy,
    decidedAt: new Date().toISOString(),
  })
}

/**
 * Samples still awaiting a decision, optionally for one client.
 * @param {string} [clientId]
 */
export async function getPendingApprovals(clientId) {
  return sampleService.list({
    filters: { status: 'PENDING', ...(clientId ? { clientId } : {}) },
  })
}

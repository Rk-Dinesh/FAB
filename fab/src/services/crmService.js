import { createService } from './createService'
import { table } from '@/mocks/db'

export const leadService = createService('leads', {
  idPrefix: 'LED',
  searchFields: ['company', 'contactName', 'email', 'country', 'segment'],
  defaultSort: { by: 'updatedAt', dir: 'desc' },
})

export const clientService = createService('clients', {
  idPrefix: 'CLI',
  searchFields: ['name', 'code', 'country', 'contactName', 'segment'],
  defaultSort: { by: 'name', dir: 'asc' },
})

export const enquiryService = createService('enquiries', {
  idPrefix: 'ENQ',
  searchFields: ['reference', 'clientName', 'styleName'],
  defaultSort: { by: 'receivedAt', dir: 'desc' },
})

export const activityService = createService('activities', {
  idPrefix: 'ACT',
  searchFields: ['summary', 'type'],
  defaultSort: { by: 'at', dir: 'desc' },
})

/**
 * Activity feed for one record.
 * @param {'lead'|'order'|'client'} entity
 * @param {string} entityId
 */
export async function getActivityFor(entity, entityId) {
  return activityService.list({ filters: { entity, entityId } })
}

/**
 * Move a lead to WON and open an enquiry from it.
 * @param {string} leadId
 * @returns {Promise<{lead: object, enquiry: object}>}
 */
export async function convertLeadToEnquiry(leadId) {
  const lead = await leadService.getById(leadId)
  if (!lead) throw new Error(`No lead with id "${leadId}"`)

  const reference = `ENQ-${2600 + table('enquiries').length}`
  const enquiry = await enquiryService.create({
    reference,
    clientId: null,
    clientName: lead.company,
    styleName: `${lead.segment} programme`,
    categoryId: 'CAT-001',
    quantity: lead.estimatedQuantity,
    targetPrice: null,
    currency: 'USD',
    requiredExFactory: null,
    status: 'OPEN',
    orderId: null,
    ownerId: lead.ownerId,
    receivedAt: new Date().toISOString(),
    brief: `Converted from lead ${lead.id}. ${lead.nextAction}`,
  })

  const updatedLead = await leadService.update(leadId, {
    stage: 'WON',
    probability: 100,
    convertedEnquiryId: enquiry.id,
    nextAction: 'Open a cost sheet against the enquiry',
  })

  await activityService.create({
    entity: 'lead',
    entityId: leadId,
    type: 'STATUS_CHANGE',
    summary: `Converted to enquiry ${enquiry.reference}.`,
    actorId: lead.ownerId,
    at: new Date().toISOString(),
  })

  return { lead: updatedLead, enquiry }
}

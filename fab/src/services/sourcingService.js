import { createService } from './createService'
import { table } from '@/mocks/db'

export const vendorService = createService('vendors', {
  idPrefix: 'VEN',
  searchFields: ['name', 'code', 'city', 'typeLabel', 'specialities'],
  defaultSort: { by: 'name', dir: 'asc' },
})

export const rfqService = createService('rfqs', {
  idPrefix: 'RFQ',
  searchFields: ['reference', 'poNumber', 'clientName', 'materialName'],
  defaultSort: { by: 'issuedAt', dir: 'desc' },
})

export const vendorQuoteService = createService('vendorQuotes', {
  idPrefix: 'VQT',
  searchFields: ['materialName'],
  defaultSort: { by: 'rate', dir: 'asc' },
})

export const materialPoService = createService('materialPos', {
  idPrefix: 'MPO',
  searchFields: ['reference', 'poNumber', 'materialName', 'clientName'],
  defaultSort: { by: 'issuedAt', dir: 'desc' },
})

export const grnService = createService('grns', {
  idPrefix: 'GRN',
  searchFields: ['reference', 'poNumber', 'materialName'],
  defaultSort: { by: 'receivedAt', dir: 'desc' },
})

/**
 * Quotes for one RFQ, with the best price and shortest lead time flagged.
 * @param {string} rfqId
 */
export async function getQuoteComparison(rfqId) {
  const rfq = await rfqService.getById(rfqId)
  if (!rfq) return null

  const quotes = table('vendorQuotes').filter((row) => row.rfqId === rfqId)
  const vendorById = Object.fromEntries(table('vendors').map((row) => [row.id, row]))
  if (quotes.length === 0) return { rfq, quotes: [] }

  const bestRate = Math.min(...quotes.map((quote) => quote.rate))
  const bestLeadTime = Math.min(...quotes.map((quote) => quote.leadTimeDays))

  return {
    rfq,
    quotes: quotes.map((quote) => ({
      ...quote,
      vendor: vendorById[quote.vendorId] ?? null,
      isBestPrice: quote.rate === bestRate,
      isFastest: quote.leadTimeDays === bestLeadTime,
      priceDeltaPercent: Number((((quote.rate - bestRate) / bestRate) * 100).toFixed(1)),
    })),
  }
}

/**
 * Award an RFQ to one vendor's quote.
 * @param {string} rfqId
 * @param {string} quoteId
 */
export async function awardRfq(rfqId, quoteId) {
  const quotes = table('vendorQuotes').filter((row) => row.rfqId === rfqId)
  for (const quote of quotes) {
    if (quote.selected !== (quote.id === quoteId)) {
      await vendorQuoteService.update(quote.id, { selected: quote.id === quoteId })
    }
  }
  return rfqService.update(rfqId, { status: 'AWARDED' })
}

/** Vendor scorecard used by the dashboards and the vendor list. */
export async function getVendorPerformance() {
  const vendors = await vendorService.list()
  const stages = table('productionStages')
  const inspections = table('inspections')

  return vendors.map((vendor) => {
    const vendorStages = stages.filter((row) => row.vendorId === vendor.id)
    const vendorInspections = inspections.filter((row) => row.vendorId === vendor.id)
    const failed = vendorInspections.filter((row) => row.result === 'FAIL').length
    return {
      ...vendor,
      activeOrders: new Set(vendorStages.map((row) => row.orderId)).size,
      delayedStages: vendorStages.filter((row) => row.status === 'DELAYED').length,
      inspectionCount: vendorInspections.length,
      inspectionPassRate:
        vendorInspections.length > 0
          ? Number((((vendorInspections.length - failed) / vendorInspections.length) * 100).toFixed(1))
          : null,
    }
  })
}

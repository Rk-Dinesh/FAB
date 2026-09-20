import { createService } from './createService'

export const costSheetService = createService('costSheets', {
  idPrefix: 'CST',
  searchFields: ['reference', 'clientName', 'styleName', 'poNumber'],
  defaultSort: { by: 'updatedAt', dir: 'desc' },
})

export const quotationService = createService('quotations', {
  idPrefix: 'QTN',
  searchFields: ['reference', 'clientName', 'styleName', 'poNumber'],
  defaultSort: { by: 'sentAt', dir: 'desc' },
})

/**
 * The FOB build-up. Kept here (not in a component) so the same maths backs the
 * cost sheet form, the quotation and the order P&L.
 * @param {{fabric?: number, trims?: number, cm?: number, wash?: number,
 *   overhead?: number, freight?: number}} lines per-piece costs
 * @param {number} marginPercent
 * @returns {{subtotal: number, marginValue: number, fobPrice: number}}
 */
export function calculateFob(lines, marginPercent) {
  const subtotal = ['fabric', 'trims', 'cm', 'wash', 'overhead', 'freight'].reduce(
    (sum, key) => sum + (Number(lines?.[key]) || 0),
    0,
  )
  const margin = Number(marginPercent) || 0
  const fobPrice = margin >= 100 ? subtotal : subtotal / (1 - margin / 100)
  return {
    subtotal: round(subtotal, 3),
    marginValue: round(fobPrice - subtotal, 3),
    fobPrice: round(fobPrice, 2),
  }
}

/**
 * Margin implied by a price that was negotiated rather than calculated.
 * @param {number} subtotal
 * @param {number} fobPrice
 * @returns {number} percentage
 */
export function marginFromPrice(subtotal, fobPrice) {
  if (!fobPrice) return 0
  return round(((fobPrice - subtotal) / fobPrice) * 100, 1)
}

/** Every version of a cost sheet's quotations, newest first. */
export async function getQuotationVersions(costSheetId) {
  const rows = await quotationService.list({ filters: { costSheetId } })
  return rows.sort((left, right) => right.version - left.version)
}

function round(value, decimals) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

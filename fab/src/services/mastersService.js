import { createService } from './createService'

/**
 * One service per masters collection. The MastersCRUD page picks the right one
 * by key, so adding a master means adding a row here and a config entry.
 */
export const mastersServices = {
  company: createService('company', { idPrefix: 'COM', searchFields: ['name', 'city'] }),
  clients: createService('clients', { idPrefix: 'CLI', searchFields: ['name', 'code', 'country', 'contactName'], defaultSort: { by: 'name', dir: 'asc' } }),
  vendors: createService('vendors', { idPrefix: 'VEN', searchFields: ['name', 'code', 'city', 'typeLabel'], defaultSort: { by: 'name', dir: 'asc' } }),
  categories: createService('categories', { idPrefix: 'CAT', searchFields: ['name', 'group'] }),
  fabrics: createService('fabrics', { idPrefix: 'FAB', searchFields: ['name', 'composition', 'group'] }),
  trims: createService('trims', { idPrefix: 'TRM', searchFields: ['name', 'group'] }),
  colors: createService('colors', { idPrefix: 'COL', searchFields: ['name', 'pantone'] }),
  'size-sets': createService('sizeSets', { idPrefix: 'SZS', searchFields: ['name', 'region'] }),
  uom: createService('uom', { idPrefix: 'UOM', searchFields: ['code', 'name'] }),
  currencies: createService('currencies', { idPrefix: 'CUR', searchFields: ['code', 'name'] }),
  ports: createService('ports', { idPrefix: 'PRT', searchFields: ['code', 'name', 'country'] }),
  incoterms: createService('incoterms', { idPrefix: 'INC', searchFields: ['code', 'name'] }),
  'payment-terms': createService('paymentTerms', { idPrefix: 'PAY', searchFields: ['code', 'description'] }),
  stages: createService('stages', { idPrefix: 'STG', searchFields: ['name', 'code'], defaultSort: { by: 'sequence', dir: 'asc' } }),
  'qc-checklists': createService('qcChecklists', { idPrefix: 'QCL', searchFields: ['name', 'stage'] }),
}

/**
 * @param {string} key masters route segment, e.g. "fabrics"
 * @returns {ReturnType<typeof createService>|null}
 */
export function mastersServiceFor(key) {
  return mastersServices[key] ?? null
}

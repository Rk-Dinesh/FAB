import { createService } from './createService'
import { table } from '@/mocks/db'

export const inspectionService = createService('inspections', {
  idPrefix: 'INS',
  searchFields: ['reference', 'poNumber', 'clientName', 'styleName', 'type'],
  defaultSort: { by: 'inspectedAt', dir: 'desc' },
})

export const defectService = createService('defects', {
  idPrefix: 'DEF',
  searchFields: ['type', 'area', 'poNumber', 'severity'],
  defaultSort: { by: 'foundAt', dir: 'desc' },
})

/**
 * AQL 2.5, general inspection level II. Sample size and the accept/reject
 * numbers follow the standard table, so the inspection form can compute them.
 * @param {number} lotSize
 * @returns {{sampleSize: number, acceptOn: number, rejectOn: number}}
 */
export function aqlPlan(lotSize) {
  const table25 = [
    [50, 8, 0, 1],
    [90, 13, 1, 2],
    [150, 20, 1, 2],
    [280, 32, 2, 3],
    [500, 50, 3, 4],
    [1200, 80, 5, 6],
    [3200, 125, 7, 8],
    [10000, 200, 10, 11],
    [35000, 315, 14, 15],
    [150000, 500, 21, 22],
    [Number.POSITIVE_INFINITY, 800, 21, 22],
  ]
  const row = table25.find(([limit]) => lotSize <= limit) ?? table25[table25.length - 1]
  return { sampleSize: row[1], acceptOn: row[2], rejectOn: row[3] }
}

/** Defect counts by type, worst first — drives the Pareto chart. */
export async function getDefectPareto(filters = {}) {
  const defects = await defectService.list({ filters })
  const byType = new Map()
  for (const defect of defects) {
    const entry = byType.get(defect.type) ?? { type: defect.type, area: defect.area, quantity: 0, occurrences: 0 }
    entry.quantity += defect.quantity
    entry.occurrences += 1
    byType.set(defect.type, entry)
  }
  return [...byType.values()].sort((left, right) => right.quantity - left.quantity)
}

/** Pass rate across all recorded inspections. */
export async function getQualitySummary() {
  const inspections = await inspectionService.list()
  const passed = inspections.filter((row) => row.result === 'PASS').length
  const failed = inspections.filter((row) => row.result === 'FAIL').length
  const openDefects = table('defects').filter((row) => row.status === 'OPEN').length
  return {
    total: inspections.length,
    passed,
    failed,
    passRate: inspections.length > 0 ? Number(((passed / inspections.length) * 100).toFixed(1)) : 0,
    openDefects,
  }
}

import { createService } from './createService'
import { table } from '@/mocks/db'
import { PRODUCTION_STAGE_FLOW } from '@/config/statuses'

export const allocationService = createService('allocations', {
  idPrefix: 'ALC',
  searchFields: ['poNumber', 'clientName'],
  defaultSort: { by: 'plannedStart', dir: 'asc' },
})

export const productionStageService = createService('productionStages', {
  idPrefix: 'PST',
  searchFields: ['poNumber', 'clientName', 'styleName', 'stage'],
  defaultSort: { by: 'plannedEnd', dir: 'asc' },
})

export const dailyOutputService = createService('dailyOutput', {
  idPrefix: 'DOP',
  searchFields: ['poNumber', 'stage'],
  defaultSort: { by: 'date', dir: 'desc' },
})

/**
 * Stage rows grouped per order, with a completion percentage.
 * @param {{status?: string}} [filters]
 */
export async function getStageTracker(filters = {}) {
  const stages = await productionStageService.list({ filters })
  const byOrder = new Map()

  for (const stage of stages) {
    if (!byOrder.has(stage.orderId)) {
      byOrder.set(stage.orderId, {
        orderId: stage.orderId,
        poNumber: stage.poNumber,
        clientName: stage.clientName,
        styleName: stage.styleName,
        vendorId: stage.vendorId,
        quantity: stage.quantityPlanned,
        stages: [],
      })
    }
    byOrder.get(stage.orderId).stages.push(stage)
  }

  return [...byOrder.values()].map((group) => {
    const ordered = [...group.stages].sort(
      (a, b) => PRODUCTION_STAGE_FLOW.indexOf(a.stage) - PRODUCTION_STAGE_FLOW.indexOf(b.stage),
    )
    const done = ordered.reduce((sum, stage) => sum + stage.quantityDone, 0)
    const planned = ordered.reduce((sum, stage) => sum + stage.quantityPlanned, 0)
    return {
      ...group,
      stages: ordered,
      completionPercent: planned > 0 ? Number(((done / planned) * 100).toFixed(1)) : 0,
      delayedStages: ordered.filter((stage) => stage.status === 'DELAYED').length,
      currentStage: ordered.find((stage) => stage.status === 'IN_PROGRESS' || stage.status === 'DELAYED')
        ?? ordered.find((stage) => stage.status === 'NOT_STARTED')
        ?? ordered[ordered.length - 1],
    }
  })
}

/**
 * Record output against a stage and roll the quantity up.
 * @param {string} stageId
 * @param {{quantityDone: number, remarks?: string, status?: string}} update
 */
export async function updateStageOutput(stageId, update) {
  const stage = table('productionStages').find((row) => row.id === stageId)
  if (!stage) throw new Error(`No production stage with id "${stageId}"`)

  const quantityDone = Math.min(stage.quantityPlanned, Math.max(0, Number(update.quantityDone) || 0))
  const status =
    update.status ??
    (quantityDone >= stage.quantityPlanned
      ? 'COMPLETED'
      : quantityDone > 0
        ? stage.status === 'DELAYED'
          ? 'DELAYED'
          : 'IN_PROGRESS'
        : 'NOT_STARTED')

  return productionStageService.update(stageId, {
    quantityDone,
    status,
    remarks: update.remarks ?? stage.remarks,
    actualEnd: status === 'COMPLETED' ? new Date().toISOString().slice(0, 10) : stage.actualEnd,
    actualStart: stage.actualStart ?? new Date().toISOString().slice(0, 10),
  })
}

/** Orders whose stages have slipped, worst first. */
export async function getDelayAlerts() {
  const tracker = await getStageTracker()
  return tracker
    .filter((group) => group.delayedStages > 0)
    .map((group) => ({
      ...group,
      worstDelayDays: Math.max(...group.stages.map((stage) => stage.delayDays ?? 0)),
    }))
    .sort((left, right) => right.worstDelayDays - left.worstDelayDays)
}

/** Daily output aggregated by date, for the output chart. */
export async function getOutputByDay(filters = {}) {
  const rows = await dailyOutputService.list({ filters })
  const byDate = new Map()
  for (const row of rows) {
    const entry = byDate.get(row.date) ?? { date: row.date, target: 0, produced: 0, rejected: 0 }
    entry.target += row.target
    entry.produced += row.produced
    entry.rejected += row.rejected
    byDate.set(row.date, entry)
  }
  return [...byDate.values()].sort((left, right) => left.date.localeCompare(right.date))
}

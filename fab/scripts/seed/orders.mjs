import { at, day, id, round } from './lib.mjs'

/**
 * 30 orders spread across every lifecycle status, 8 of them delayed.
 * `offset` is the ex-factory date relative to today: negative = shipped/past.
 */
const ORDER_PLAN = [
  // [status, clientId, exFactoryOffset, risk]
  ['LEAD', 'CLI-003', 118, 'ON_TRACK'],
  ['LEAD', 'CLI-006', 132, 'ON_TRACK'],
  ['ENQUIRY', 'CLI-001', 104, 'ON_TRACK'],
  ['ENQUIRY', 'CLI-005', 112, 'ON_TRACK'],
  ['DESIGN', 'CLI-004', 96, 'ON_TRACK'],
  ['DESIGN', 'CLI-006', 88, 'AT_RISK'],
  ['COSTING', 'CLI-002', 92, 'ON_TRACK'],
  ['COSTING', 'CLI-003', 86, 'ON_TRACK'],
  ['QUOTED', 'CLI-001', 80, 'ON_TRACK'],
  ['QUOTED', 'CLI-005', 78, 'AT_RISK'],
  ['CONFIRMED', 'CLI-001', 74, 'ON_TRACK'],
  ['CONFIRMED', 'CLI-004', 70, 'ON_TRACK'],
  ['SAMPLING', 'CLI-002', 64, 'ON_TRACK'],
  ['SAMPLING', 'CLI-006', 58, 'DELAYED'],
  ['SOURCING', 'CLI-001', 52, 'DELAYED'],
  ['SOURCING', 'CLI-003', 46, 'DELAYED'],
  ['PRODUCTION', 'CLI-001', 34, 'ON_TRACK'],
  ['PRODUCTION', 'CLI-002', 28, 'AT_RISK'],
  ['PRODUCTION', 'CLI-004', 22, 'DELAYED'],
  ['PRODUCTION', 'CLI-005', 18, 'DELAYED'],
  ['QC', 'CLI-001', 12, 'ON_TRACK'],
  ['QC', 'CLI-003', 8, 'DELAYED'],
  ['READY_TO_SHIP', 'CLI-002', 4, 'ON_TRACK'],
  ['READY_TO_SHIP', 'CLI-006', 2, 'DELAYED'],
  ['SHIPPED', 'CLI-001', -9, 'ON_TRACK'],
  ['SHIPPED', 'CLI-005', -16, 'DELAYED'],
  ['DELIVERED', 'CLI-004', -34, 'ON_TRACK'],
  ['DELIVERED', 'CLI-002', -48, 'ON_TRACK'],
  ['PAYMENT_RECEIVED', 'CLI-001', -66, 'ON_TRACK'],
  ['CLOSED', 'CLI-003', -92, 'ON_TRACK'],
]

const STYLES = [
  ['Heavyweight pocket tee', 'CAT-001', 'FAB-001', 'SZS-001', false],
  ['Organic crew tee', 'CAT-001', 'FAB-002', 'SZS-001', false],
  ['Classic pique polo', 'CAT-001', 'FAB-003', 'SZS-002', false],
  ['Garment-dyed hoodie', 'CAT-003', 'FAB-005', 'SZS-002', true],
  ['French terry crewneck', 'CAT-003', 'FAB-004', 'SZS-001', false],
  ['Tapered jogger', 'CAT-002', 'FAB-004', 'SZS-001', false],
  ['Ribbed tank', 'CAT-001', 'FAB-006', 'SZS-003', false],
  ['Oxford button-down', 'CAT-004', 'FAB-009', 'SZS-002', false],
  ['Poplin camp shirt', 'CAT-004', 'FAB-008', 'SZS-001', false],
  ['Stretch twill chino', 'CAT-005', 'FAB-010', 'SZS-006', false],
  ['Selvedge-look denim', 'CAT-005', 'FAB-011', 'SZS-006', true],
  ['Canvas chore jacket', 'CAT-007', 'FAB-012', 'SZS-002', true],
  ['Viscose midi dress', 'CAT-006', 'FAB-013', 'SZS-003', false],
  ['Linen blend shirtdress', 'CAT-006', 'FAB-014', 'SZS-003', false],
  ['Performance training tee', 'CAT-008', 'FAB-015', 'SZS-001', false],
  ['High-rise legging', 'CAT-008', 'FAB-016', 'SZS-003', false],
  ['Kids organic tee', 'CAT-009', 'FAB-002', 'SZS-004', false],
  ['Kids fleece hoodie', 'CAT-009', 'FAB-005', 'SZS-005', true],
  ['Interlock long sleeve', 'CAT-001', 'FAB-007', 'SZS-001', false],
  ['Overshirt in twill', 'CAT-007', 'FAB-010', 'SZS-002', false],
]

const TA_MILESTONES = [
  ['PO received', 'Merchandising', -76],
  ['Tech pack released', 'Design', -70],
  ['Lab dip approved', 'Design', -63],
  ['PP sample approved', 'Design', -52],
  ['Fabric PO placed', 'Sourcing', -58],
  ['Trims PO placed', 'Sourcing', -54],
  ['Fabric in-house', 'Sourcing', -34],
  ['Trims in-house', 'Sourcing', -30],
  ['Cutting start', 'Production', -28],
  ['Sewing start', 'Production', -24],
  ['Sewing end', 'Production', -10],
  ['Finishing complete', 'Production', -6],
  ['Final inspection', 'Quality', -3],
  ['Ex-factory', 'Logistics', 0],
]

const STAGE_PLAN = [
  ['FABRIC_INHOUSE', -34, -30],
  ['CUTTING', -28, -25],
  ['STITCHING', -24, -11],
  ['WASHING_EMB', -11, -8],
  ['FINISHING', -8, -5],
  ['PACKING', -5, -3],
  ['FINAL_INSPECTION', -3, -1],
]

const ORDER_STATUS_FLOW = [
  'LEAD', 'ENQUIRY', 'DESIGN', 'COSTING', 'QUOTED', 'CONFIRMED', 'SAMPLING', 'SOURCING',
  'PRODUCTION', 'QC', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'PAYMENT_RECEIVED', 'CLOSED',
]

const FACTORY_IDS = ['VEN-014', 'VEN-015', 'VEN-016', 'VEN-017', 'VEN-018', 'VEN-019', 'VEN-020', 'VEN-021']
const MERCHANDISER_IDS = ['EMP-005', 'EMP-006', 'EMP-007', 'EMP-008', 'EMP-009', 'EMP-010']
const COLOR_IDS = ['COL-001', 'COL-002', 'COL-003', 'COL-004', 'COL-005', 'COL-006', 'COL-007', 'COL-008', 'COL-009', 'COL-010', 'COL-011', 'COL-012', 'COL-013', 'COL-014']
const SIZE_SETS = {
  'SZS-001': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'SZS-002': ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
  'SZS-003': ['2', '4', '6', '8', '10', '12', '14'],
  'SZS-004': ['2Y', '3Y', '4Y', '5Y', '6Y', '8Y'],
  'SZS-005': ['8Y', '10Y', '12Y', '14Y'],
  'SZS-006': ['28', '30', '32', '34', '36', '38'],
}
// Typical buy curves, normalised per size set.
const SIZE_CURVES = {
  'SZS-001': [0.08, 0.18, 0.28, 0.26, 0.14, 0.06],
  'SZS-002': [0.14, 0.26, 0.28, 0.18, 0.09, 0.05],
  'SZS-003': [0.09, 0.14, 0.19, 0.21, 0.17, 0.12, 0.08],
  'SZS-004': [0.14, 0.18, 0.2, 0.2, 0.16, 0.12],
  'SZS-005': [0.28, 0.27, 0.25, 0.2],
  'SZS-006': [0.11, 0.2, 0.25, 0.21, 0.14, 0.09],
}

/**
 * Build the order book plus everything derived from it.
 * @param {ReturnType<import('./lib.mjs').rng>} random
 * @param {Array<object>} clients
 */
export function buildOrders(random, clients) {
  const clientById = Object.fromEntries(clients.map((client) => [client.id, client]))
  const orders = []
  const productionStages = []
  const allocations = []
  const dailyOutput = []

  ORDER_PLAN.forEach((plan, index) => {
    const [status, clientId, exFactoryOffset, risk] = plan
    const client = clientById[clientId]
    const style = STYLES[index % STYLES.length]
    const [styleName, categoryId, fabricId, sizeSetId, hasWash] = style
    const statusIndex = ORDER_STATUS_FLOW.indexOf(status)
    const orderId = id('ORD', index + 1)
    const poNumber = `PO-${1001 + index}`
    const sizes = SIZE_SETS[sizeSetId]
    const curve = SIZE_CURVES[sizeSetId]

    const colorCount = random.int(2, 4)
    const colorIds = random.sample(COLOR_IDS, colorCount)
    const targetQty = random.int(4, 26) * 1000
    const perColor = Math.round(targetQty / colorCount)

    /** @type {Array<{colorId: string, sizes: Record<string, number>, total: number}>} */
    const sizeMatrix = colorIds.map((colorId) => {
      const row = {}
      let total = 0
      sizes.forEach((size, sizeIndex) => {
        const quantity = Math.round((perColor * curve[sizeIndex]) / 12) * 12
        row[size] = quantity
        total += quantity
      })
      return { colorId, sizes: row, total }
    })
    const quantity = sizeMatrix.reduce((sum, row) => sum + row.total, 0)

    const fobPrice = round(random.float(4.2, 26.5, 2), 2)
    const orderValue = round(quantity * fobPrice, 2)
    const hasDesign = index % 3 !== 1

    const confirmedOffset = exFactoryOffset - random.int(74, 96)
    const enquiryOffset = confirmedOffset - random.int(14, 40)
    const shipOffset = exFactoryOffset + random.int(3, 6)
    const transitDays = client.country === 'United States' ? random.int(26, 34) : random.int(20, 28)

    // Delay is what makes the T&A tab worth looking at: push the late stages out.
    const slipDays = risk === 'DELAYED' ? random.int(5, 16) : risk === 'AT_RISK' ? random.int(2, 4) : 0

    const milestones = TA_MILESTONES.map(([name, owner, relative]) => {
      const planned = exFactoryOffset + relative
      const late = relative >= -24 ? slipDays : Math.round(slipDays / 2)
      const isPast = planned + late <= 0
      const reached = statusIndex >= 8 || planned <= 0
      return {
        name,
        owner,
        plannedDate: day(planned),
        actualDate: reached && isPast ? day(planned + late) : null,
        delayDays: reached && isPast ? late : 0,
        status: !reached ? 'PENDING' : isPast ? (late > 0 ? 'LATE' : 'DONE') : 'IN_PROGRESS',
      }
    })

    const factoryVendorId = statusIndex >= 5 ? FACTORY_IDS[index % FACTORY_IDS.length] : null
    const merchandiserId = client.accountManagerId ?? MERCHANDISER_IDS[index % MERCHANDISER_IDS.length]

    const order = {
      id: orderId,
      poNumber,
      clientPoNumber: `${client.code}-${2600 + index * 7}`,
      clientId,
      clientName: client.name,
      styleNumber: `${client.code}-${2400 + index * 11}`,
      styleName,
      categoryId,
      fabricId,
      sizeSetId,
      colorIds,
      sizeMatrix,
      quantity,
      unit: 'PCS',
      fobPrice,
      currency: 'USD',
      orderValue,
      status,
      statusIndex,
      risk,
      hasDesign,
      hasWash,
      incoterm: client.incoterm,
      paymentTermCode: client.paymentTermCode,
      destinationPortId: client.destinationPortId,
      merchandiserId,
      factoryVendorId,
      enquiryDate: day(enquiryOffset),
      confirmedDate: statusIndex >= 5 ? day(confirmedOffset) : null,
      exFactoryDate: day(exFactoryOffset),
      revisedExFactoryDate: slipDays > 0 ? day(exFactoryOffset + slipDays) : null,
      shipDate: statusIndex >= 11 ? day(shipOffset + slipDays) : null,
      deliveryDate: statusIndex >= 11 ? day(shipOffset + slipDays + transitDays) : day(exFactoryOffset + transitDays),
      delayDays: slipDays,
      milestones,
      season: exFactoryOffset > 40 ? 'SS27' : exFactoryOffset > -20 ? 'AW26' : 'SS26',
      createdAt: at(enquiryOffset, 10),
      updatedAt: at(Math.min(0, exFactoryOffset), 16),
    }
    orders.push(order)

    if (statusIndex >= 5 && factoryVendorId) {
      allocations.push({
        id: id('ALC', allocations.length + 1),
        orderId,
        poNumber,
        clientName: client.name,
        vendorId: factoryVendorId,
        quantity,
        allocatedAt: day(confirmedOffset + random.int(2, 8)),
        lineCount: Math.max(1, Math.round(quantity / 9000)),
        dailyCapacity: random.int(900, 2400),
        plannedStart: day(exFactoryOffset - 28),
        plannedEnd: day(exFactoryOffset - 4),
        status: statusIndex >= 10 ? 'COMPLETED' : statusIndex >= 8 ? 'RUNNING' : 'PLANNED',
        notes: slipDays > 0 ? 'Line rebalanced after a fabric delay.' : 'Capacity confirmed with the unit.',
      })
    }

    // Production stage rows exist from SOURCING onward so the tracker has data.
    if (statusIndex >= 7) {
      const applicable = STAGE_PLAN.filter(([code]) => code !== 'WASHING_EMB' || hasWash)
      applicable.forEach(([code, startRelative, endRelative], stageIndex) => {
        const plannedStart = exFactoryOffset + startRelative
        const plannedEnd = exFactoryOffset + endRelative
        const late = slipDays
        const actualStart = plannedStart + Math.round(late / 2)
        const actualEnd = plannedEnd + late

        let stageStatus = 'NOT_STARTED'
        let quantityDone = 0
        if (actualEnd <= 0) {
          stageStatus = 'COMPLETED'
          quantityDone = quantity
        } else if (actualStart <= 0) {
          const span = Math.max(1, actualEnd - actualStart)
          const elapsed = Math.max(0, -actualStart)
          const ratio = Math.min(0.97, elapsed / span)
          quantityDone = Math.round((quantity * ratio) / 12) * 12
          stageStatus = plannedEnd < 0 ? 'DELAYED' : 'IN_PROGRESS'
        }
        if (statusIndex >= 10) {
          stageStatus = 'COMPLETED'
          quantityDone = quantity
        }

        productionStages.push({
          id: `${orderId}-${code}`,
          orderId,
          poNumber,
          clientName: client.name,
          styleName,
          vendorId: factoryVendorId,
          stage: code,
          sequence: stageIndex + 1,
          plannedStart: day(plannedStart),
          plannedEnd: day(plannedEnd),
          actualStart: stageStatus === 'NOT_STARTED' ? null : day(actualStart),
          actualEnd: stageStatus === 'COMPLETED' ? day(actualEnd) : null,
          quantityPlanned: quantity,
          quantityDone,
          status: stageStatus,
          delayDays: stageStatus === 'DELAYED' ? Math.max(1, -plannedEnd) : 0,
          remarks:
            stageStatus === 'DELAYED'
              ? 'Behind plan — running an extra shift to recover.'
              : stageStatus === 'IN_PROGRESS'
                ? 'Running to plan on the allocated lines.'
                : '',
        })

        // Daily output rows drive the output charts; keep the trailing 60 days.
        if (['CUTTING', 'STITCHING', 'FINISHING', 'PACKING'].includes(code) && stageStatus !== 'NOT_STARTED') {
          const from = Math.max(actualStart, -60)
          for (let offset = from; offset <= Math.min(0, actualEnd); offset += 1) {
            const date = new Date(at(offset))
            if (date.getUTCDay() === 0) continue // Sunday off
            const target = Math.round(quantity / Math.max(1, actualEnd - actualStart))
            const produced = Math.max(0, Math.round(target * random.float(0.72, 1.12, 2)))
            dailyOutput.push({
              id: id('DOP', dailyOutput.length + 1, 4),
              orderId,
              poNumber,
              vendorId: factoryVendorId,
              stage: code,
              date: day(offset),
              target,
              produced,
              rejected: Math.round(produced * random.float(0.004, 0.022, 4)),
              lines: Math.max(1, Math.round(quantity / 9000)),
              manpower: random.int(28, 96),
              efficiencyPercent: round((produced / Math.max(1, target)) * 100, 1),
            })
          }
        }
      })
    }
  })

  return { orders, productionStages, allocations, dailyOutput }
}

export { ORDER_STATUS_FLOW, SIZE_SETS }

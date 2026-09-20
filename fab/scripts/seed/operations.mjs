import { at, day, id, round } from './lib.mjs'

const MILL_IDS = ['VEN-001', 'VEN-002', 'VEN-003', 'VEN-004', 'VEN-005', 'VEN-006', 'VEN-007']
const TRIM_IDS = ['VEN-008', 'VEN-009', 'VEN-010', 'VEN-011', 'VEN-012', 'VEN-013']
const WASH_IDS = ['VEN-022', 'VEN-023', 'VEN-024', 'VEN-025']

/** RFQs, vendor quotes, material POs and goods received notes. */
export function buildSourcing(random, orders, fabrics, trims) {
  const fabricById = Object.fromEntries(fabrics.map((fabric) => [fabric.id, fabric]))
  const rfqs = []
  const vendorQuotes = []
  const materialPos = []
  const grns = []

  orders
    .filter((order) => order.statusIndex >= 4)
    .forEach((order, index) => {
      const fabric = fabricById[order.fabricId]
      const consumption = round(random.float(0.2, 0.6, 3), 3)
      const fabricQuantity = Math.round(order.quantity * consumption * 1.04)
      const issuedOffset = -random.int(30, 140)
      const rfqId = id('RFQ', index + 1)
      const invited = random.sample(MILL_IDS, 3)

      rfqs.push({
        id: rfqId,
        reference: `RFQ-${6100 + index}`,
        orderId: order.id,
        poNumber: order.poNumber,
        clientName: order.clientName,
        materialType: 'FABRIC',
        materialId: order.fabricId,
        materialName: fabric.name,
        quantity: fabricQuantity,
        uom: fabric.uom,
        requiredBy: day(issuedOffset + random.int(25, 45)),
        invitedVendorIds: invited,
        status: order.statusIndex >= 7 ? 'AWARDED' : order.statusIndex >= 5 ? 'QUOTES_IN' : 'ISSUED',
        issuedAt: at(issuedOffset, 10),
        issuedById: ['EMP-018', 'EMP-019', 'EMP-020'][index % 3],
        notes: 'Quote against the approved lab dip. Confirm GSM tolerance and delivery to the unit.',
      })

      const quotes = invited.map((vendorId, quoteIndex) => {
        const rate = round(fabric.standardRate * random.float(0.9, 1.16, 3), 3)
        return {
          id: id('VQT', vendorQuotes.length + quoteIndex + 1, 4),
          rfqId,
          orderId: order.id,
          vendorId,
          materialId: order.fabricId,
          materialName: fabric.name,
          quantity: fabricQuantity,
          uom: fabric.uom,
          rate,
          currency: 'USD',
          totalValue: round(rate * fabricQuantity, 2),
          leadTimeDays: random.int(16, 38),
          paymentTermCode: random.pick(['TT 30', 'TT 45', 'Advance', '30/70']),
          validUntil: day(issuedOffset + 30),
          receivedAt: at(issuedOffset + random.int(2, 7), 14),
          remarks: random.pick([
            'Rate held for 30 days against current yarn prices.',
            'Delivery in two lots; first lot in 18 days.',
            'Includes GOTS transaction certificate.',
            'Excludes freight to the unit.',
          ]),
          selected: false,
        }
      })
      // Best price wins unless the lead time blows the ex-factory date.
      const viable = quotes.filter((quote) => quote.leadTimeDays <= 32)
      const winner = (viable.length > 0 ? viable : quotes).reduce((best, quote) =>
        quote.rate < best.rate ? quote : best,
      )
      winner.selected = true
      vendorQuotes.push(...quotes)

      if (order.statusIndex >= 7) {
        const poId = id('MPO', materialPos.length + 1)
        const poIssued = issuedOffset + random.int(6, 12)
        const expected = poIssued + winner.leadTimeDays
        const received = expected + (order.risk === 'DELAYED' ? random.int(4, 12) : random.int(-2, 3))
        const receivedQuantity =
          order.statusIndex >= 8
            ? Math.round(fabricQuantity * (random.chance(0.18) ? random.float(0.9, 0.98, 3) : 1))
            : 0

        materialPos.push({
          id: poId,
          reference: `MPO-${7100 + materialPos.length}`,
          orderId: order.id,
          poNumber: order.poNumber,
          clientName: order.clientName,
          vendorId: winner.vendorId,
          materialType: 'FABRIC',
          materialId: order.fabricId,
          materialName: fabric.name,
          quantity: fabricQuantity,
          uom: fabric.uom,
          rate: winner.rate,
          currency: 'USD',
          totalValue: round(winner.rate * fabricQuantity, 2),
          issuedAt: day(poIssued),
          expectedAt: day(expected),
          receivedQuantity,
          status:
            receivedQuantity === 0
              ? 'ISSUED'
              : receivedQuantity < fabricQuantity
                ? 'PARTIAL'
                : 'RECEIVED',
          paymentTermCode: winner.paymentTermCode,
          issuedById: ['EMP-018', 'EMP-019', 'EMP-020'][index % 3],
        })

        // A trims PO alongside the fabric PO.
        const trim = trims[index % trims.length]
        const trimQuantity = Math.round(order.quantity * random.float(1.02, 1.08, 3))
        materialPos.push({
          id: id('MPO', materialPos.length + 1),
          reference: `MPO-${7100 + materialPos.length}`,
          orderId: order.id,
          poNumber: order.poNumber,
          clientName: order.clientName,
          vendorId: TRIM_IDS[index % TRIM_IDS.length],
          materialType: 'TRIM',
          materialId: trim.id,
          materialName: trim.name,
          quantity: trimQuantity,
          uom: trim.uom,
          rate: trim.standardRate,
          currency: 'USD',
          totalValue: round(trim.standardRate * trimQuantity, 2),
          issuedAt: day(poIssued + 2),
          expectedAt: day(poIssued + random.int(10, 18)),
          receivedQuantity: order.statusIndex >= 8 ? trimQuantity : 0,
          status: order.statusIndex >= 8 ? 'RECEIVED' : 'ISSUED',
          paymentTermCode: 'TT 30',
          issuedById: ['EMP-018', 'EMP-019', 'EMP-020'][index % 3],
        })

        if (receivedQuantity > 0) {
          const shortfall = fabricQuantity - receivedQuantity
          grns.push({
            id: id('GRN', grns.length + 1),
            reference: `GRN-${8100 + grns.length}`,
            materialPoId: poId,
            orderId: order.id,
            poNumber: order.poNumber,
            vendorId: winner.vendorId,
            materialName: fabric.name,
            orderedQuantity: fabricQuantity,
            receivedQuantity,
            shortfallQuantity: shortfall,
            uom: fabric.uom,
            receivedAt: day(received),
            inspectedAt: day(received + 1),
            inspectionResult: random.chance(0.86) ? 'PASS' : 'CONDITIONAL',
            fourPointScore: random.int(6, 24),
            acceptedQuantity: receivedQuantity,
            rejectedQuantity: 0,
            receivedById: ['EMP-021', 'EMP-022', 'EMP-023'][grns.length % 3],
            remarks:
              shortfall > 0
                ? `Short by ${shortfall} ${fabric.uom} — balance confirmed for the next lot.`
                : 'Full quantity received. 4-point score within tolerance.',
          })
        }
      }
    })

  return { rfqs, vendorQuotes, materialPos, grns }
}

const DEFECT_TYPES = [
  ['Broken stitch', 'MAJOR', 'Stitching'],
  ['Skipped stitch', 'MAJOR', 'Stitching'],
  ['Open seam', 'CRITICAL', 'Stitching'],
  ['Uneven hem', 'MINOR', 'Stitching'],
  ['Shade variation', 'MAJOR', 'Fabric'],
  ['Fabric hole', 'CRITICAL', 'Fabric'],
  ['Oil stain', 'MAJOR', 'Handling'],
  ['Print misplacement', 'MAJOR', 'Printing'],
  ['Label missing', 'MAJOR', 'Trims'],
  ['Loose thread', 'MINOR', 'Finishing'],
  ['Measurement out of tolerance', 'MAJOR', 'Pattern'],
  ['Puckering at side seam', 'MINOR', 'Stitching'],
]

/** AQL 2.5 inspections and the defect log behind them. */
export function buildQuality(random, orders) {
  const inspections = []
  const defects = []

  orders
    .filter((order) => order.statusIndex >= 8)
    .forEach((order, index) => {
      const rounds = order.statusIndex >= 9 ? 2 : 1
      for (let roundIndex = 0; roundIndex < rounds; roundIndex += 1) {
        const isFinal = roundIndex === rounds - 1 && order.statusIndex >= 9
        const offered = isFinal ? order.quantity : Math.round(order.quantity * random.float(0.3, 0.6, 2))
        // AQL 2.5, general inspection level II — sample size by lot size.
        const sampleSize = offered > 35000 ? 800 : offered > 10000 ? 500 : offered > 3200 ? 315 : 200
        const acceptOn = sampleSize >= 800 ? 21 : sampleSize >= 500 ? 14 : sampleSize >= 315 ? 10 : 7
        const rejectOn = acceptOn + 1
        const found = random.int(0, Math.round(acceptOn * 1.5))
        const result = order.statusIndex >= 10 ? 'PASS' : found <= acceptOn ? 'PASS' : 'FAIL'
        const inspectedOffset = -random.int(1, 30)
        const inspectionId = id('INS', inspections.length + 1)

        inspections.push({
          id: inspectionId,
          reference: `QC-${9100 + inspections.length}`,
          orderId: order.id,
          poNumber: order.poNumber,
          clientId: order.clientId,
          clientName: order.clientName,
          styleName: order.styleName,
          vendorId: order.factoryVendorId,
          type: isFinal ? 'FINAL' : 'INLINE',
          checklistId: isFinal ? 'QCL-001' : 'QCL-002',
          aql: '2.5',
          inspectionLevel: 'GII',
          offeredQuantity: offered,
          sampleSize,
          acceptOn,
          rejectOn,
          defectsFound: found,
          criticalCount: Math.max(0, Math.round(found * 0.08)),
          majorCount: Math.round(found * 0.55),
          minorCount: found - Math.round(found * 0.55) - Math.max(0, Math.round(found * 0.08)),
          result,
          inspectedAt: at(inspectedOffset, 11),
          inspectorId: ['EMP-031', 'EMP-032', 'EMP-033', 'EMP-034'][inspections.length % 4],
          remarks:
            result === 'FAIL'
              ? 'Lot rejected — 100% re-check and re-offer within three days.'
              : 'Lot accepted. Cartons sealed and marked for dispatch.',
        })

        for (let defectIndex = 0; defectIndex < Math.min(found, 4); defectIndex += 1) {
          const [type, severity, area] = DEFECT_TYPES[(index + defectIndex) % DEFECT_TYPES.length]
          defects.push({
            id: id('DEF', defects.length + 1, 4),
            inspectionId,
            orderId: order.id,
            poNumber: order.poNumber,
            vendorId: order.factoryVendorId,
            type,
            severity,
            area,
            quantity: random.int(1, 9),
            stage: isFinal ? 'FINAL_INSPECTION' : 'STITCHING',
            foundAt: at(inspectedOffset, 12),
            correctiveAction: random.pick([
              'Re-stitched and re-pressed; operator retrained on the seam.',
              'Panel replaced from the same shade lot.',
              'Spot cleaned and re-inspected.',
              'Re-printed on replacement bodies.',
              'Label re-attached and 100% checked.',
            ]),
            status: random.chance(0.78) ? 'CLOSED' : 'OPEN',
          })
        }
      }
    })

  return { inspections, defects }
}

const CARRIERS = ['Maersk', 'CMA CGM', 'Hapag-Lloyd', 'MSC', 'ONE']
const AIRLINES = ['Emirates SkyCargo', 'Lufthansa Cargo', 'Qatar Airways Cargo']

/** Shipments, export documents and the tracking timeline. */
export function buildLogistics(random, orders, clients) {
  const clientById = Object.fromEntries(clients.map((client) => [client.id, client]))
  const shipments = []
  const documents = []

  orders
    .filter((order) => order.statusIndex >= 10)
    .forEach((order, index) => {
      const client = clientById[order.clientId]
      const byAir = random.chance(0.18)
      const etdOffset = Number(daysBetween(order.shipDate ?? order.exFactoryDate))
      const transit = byAir ? random.int(4, 8) : client.country === 'United States' ? random.int(26, 34) : random.int(20, 28)
      const etaOffset = etdOffset + transit
      const cartons = Math.round(order.quantity / random.int(40, 70))
      const shipmentId = id('SHP', index + 1)

      const status =
        order.statusIndex >= 12
          ? 'DELIVERED'
          : order.statusIndex >= 11
            ? etaOffset < 0
              ? 'ARRIVED'
              : 'IN_TRANSIT'
            : order.statusIndex >= 10
              ? 'BOOKED'
              : 'PLANNED'

      const milestones = [
        ['Booking confirmed', etdOffset - 10],
        ['Cargo ready at factory', etdOffset - 4],
        ['Customs cleared', etdOffset - 2],
        ['Departed origin port', etdOffset],
        ['In transit', etdOffset + Math.round(transit / 2)],
        ['Arrived destination port', etaOffset],
        ['Delivered to consignee', etaOffset + 4],
      ].map(([label, offset]) => ({
        label,
        date: day(offset),
        done: offset <= 0 && (status !== 'BOOKED' || offset <= etdOffset - 4),
      }))

      shipments.push({
        id: shipmentId,
        reference: `SHP-${9600 + index}`,
        orderId: order.id,
        poNumber: order.poNumber,
        clientId: order.clientId,
        clientName: order.clientName,
        mode: byAir ? 'AIR' : 'SEA',
        carrier: byAir ? random.pick(AIRLINES) : random.pick(CARRIERS),
        blNumber: byAir ? `AWB${random.int(10000000, 99999999)}` : `BL${random.int(100000, 999999)}IN`,
        containerNumber: byAir ? null : `MSKU${random.int(1000000, 9999999)}`,
        containerType: byAir ? null : cartons > 900 ? '40HC' : '20GP',
        originPortId: byAir ? 'PRT-004' : 'PRT-001',
        destinationPortId: order.destinationPortId,
        incoterm: order.incoterm,
        cartons,
        grossWeightKg: round(order.quantity * random.float(0.22, 0.48, 3), 1),
        cbm: round(cartons * random.float(0.055, 0.085, 4), 2),
        etd: day(etdOffset),
        eta: day(etaOffset),
        atd: etdOffset <= 0 ? day(etdOffset) : null,
        ata: etaOffset <= 0 ? day(etaOffset) : null,
        freightCostUsd: round(byAir ? order.quantity * random.float(0.55, 1.2, 3) : cartons * random.float(2.2, 4.6, 2), 2),
        status,
        milestones,
        bookedById: ['EMP-036', 'EMP-037', 'EMP-038'][index % 3],
        notes: byAir ? 'Airfreighted to recover the delay; cost shared with the client.' : 'Standard ocean booking on the direct service.',
      })

      const docTypes = [
        ['COMMERCIAL_INVOICE', 'Commercial invoice', 'CI'],
        ['PACKING_LIST', 'Packing list', 'PL'],
        ['BILL_OF_LADING', byAir ? 'Air waybill' : 'Bill of lading', 'BL'],
        ['CERTIFICATE_OF_ORIGIN', 'Certificate of origin', 'COO'],
        ['INSPECTION_CERTIFICATE', 'Inspection certificate', 'IC'],
      ]
      docTypes.forEach(([type, name, short], docIndex) => {
        documents.push({
          id: id('DOC', documents.length + 1, 4),
          shipmentId,
          orderId: order.id,
          poNumber: order.poNumber,
          clientName: order.clientName,
          type,
          name,
          number: `${short}-${2026}${String(index + 1).padStart(3, '0')}`,
          issuedAt: day(etdOffset - (docIndex < 2 ? 5 : 2)),
          issuedById: ['EMP-036', 'EMP-037', 'EMP-038'][docIndex % 3],
          fileName: `${short.toLowerCase()}-${order.poNumber.toLowerCase()}.pdf`,
          sizeKb: random.int(80, 520),
          status: etdOffset <= 0 ? 'ISSUED' : 'DRAFT',
        })
      })
    })

  return { shipments, documents }
}

const UPDATE_TEMPLATES = [
  ['Sampling', 'PP sample dispatched — tracking shared by email.'],
  ['Sourcing', 'Fabric in-house and 4-point inspected. Cutting starts on plan.'],
  ['Production', 'Stitching is {percent}% complete across {lines} lines.'],
  ['Production', 'Running {days} days behind plan; recovery shift added over the weekend.'],
  ['Quality', 'Final AQL 2.5 inspection passed. Cartons sealed for dispatch.'],
  ['Logistics', 'Booking confirmed — ETD {etd}, ETA {eta}.'],
  ['Logistics', 'Shipment departed origin. Documents couriered today.'],
  ['Finance', 'Commercial invoice raised against the shipment.'],
]

/** What the brand has actually been told, per order. */
export function buildClientUpdates(random, orders, shipments) {
  const shipmentByOrder = Object.fromEntries(shipments.map((shipment) => [shipment.orderId, shipment]))
  const updates = []

  orders
    .filter((order) => order.statusIndex >= 5)
    .forEach((order) => {
      const count = Math.min(4, Math.max(1, Math.round(order.statusIndex / 3)))
      for (let index = 0; index < count; index += 1) {
        const [area, template] = UPDATE_TEMPLATES[(order.statusIndex + index) % UPDATE_TEMPLATES.length]
        const shipment = shipmentByOrder[order.id]
        const body = template
          .replace('{percent}', String(random.int(35, 95)))
          .replace('{lines}', String(random.int(2, 6)))
          .replace('{days}', String(Math.max(1, order.delayDays)))
          .replace('{etd}', shipment?.etd ?? order.exFactoryDate)
          .replace('{eta}', shipment?.eta ?? order.deliveryDate)
        updates.push({
          id: id('CUP', updates.length + 1, 4),
          orderId: order.id,
          poNumber: order.poNumber,
          clientId: order.clientId,
          clientName: order.clientName,
          area,
          subject: `${order.poNumber} — ${area} update`,
          body,
          channel: random.pick(['EMAIL', 'PORTAL', 'EMAIL']),
          sentAt: at(-random.int(1, 60), random.int(9, 18)),
          sentById: order.merchandiserId,
          acknowledged: random.chance(0.62),
        })
      }
    })

  updates.sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1))
  return updates
}

/** @param {string} isoDay YYYY-MM-DD */
function daysBetween(isoDay) {
  const reference = new Date('2026-09-20T00:00:00.000Z').getTime()
  return Math.round((new Date(`${isoDay}T00:00:00.000Z`).getTime() - reference) / 86400000)
}

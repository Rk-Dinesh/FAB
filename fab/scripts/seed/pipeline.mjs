import { at, day, id, round } from './lib.mjs'

const LEAD_SOURCES = ['Website contact form', 'Trade show — Première Vision', 'Referral', 'LinkedIn outreach', 'Existing client referral', 'Sourcing agent introduction']
const LEAD_STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST']

const PROSPECTS = [
  ['Copper Row Supply', 'United States', 'Denver, CO', 'Workwear basics', 'Tessa Hollins', 'tessa@copperrowsupply.com'],
  ['Halden & Co.', 'United Kingdom', 'Bristol', 'Heritage knitwear', 'Owen Pryce', 'owen@haldenco.co.uk'],
  ['Marea Swim', 'Italy', 'Milan', 'Swim and resort', 'Giulia Ferri', 'giulia@mareaswim.it'],
  ['Pine & Pace', 'Canada', 'Toronto', 'Outdoor layering', 'Marc Tremblay', 'marc@pineandpace.ca'],
  ['Solstice Yoga', 'Australia', 'Melbourne', 'Studio activewear', 'Hana Nakamura', 'hana@solsticeyoga.au'],
  ['Little Bramble', 'Netherlands', 'Utrecht', 'Organic babywear', 'Sanne de Vries', 'sanne@littlebramble.nl'],
  ['Foundry Denim', 'United States', 'Austin, TX', 'Raw denim', 'Cole Whitaker', 'cole@foundrydenim.com'],
  ['Aster Uniform Group', 'United Arab Emirates', 'Dubai', 'Hospitality uniforms', 'Yusuf Rahman', 'yusuf@asteruniform.ae'],
  ['Quay Street Goods', 'Ireland', 'Galway', 'Coastal casual', 'Niamh Flynn', 'niamh@quaystreetgoods.ie'],
  ['Kestrel Performance', 'Germany', 'Cologne', 'Trail running kit', 'Lena Brandt', 'lena@kestrelperf.de'],
  ['Mesa Verde Outfitters', 'United States', 'Santa Fe, NM', 'Southwest casual', 'Rosa Delgado', 'rosa@mesaverdeoutfitters.com'],
  ['Northbank Studio', 'Sweden', 'Gothenburg', 'Minimal essentials', 'Elin Svensson', 'elin@northbankstudio.se'],
  ['Cobble & Crew', 'United Kingdom', 'Leeds', 'Kids streetwear', 'Dan Okonkwo', 'dan@cobbleandcrew.co.uk'],
  ['Terra Firma Apparel', 'Spain', 'Valencia', 'Hemp and linen', 'Pablo Ortega', 'pablo@terrafirma.es'],
  ['Union Hill Athletics', 'United States', 'Nashville, TN', 'College athleisure', 'Brianna Moss', 'brianna@unionhill.co'],
  ['Saffron Row', 'India', 'Mumbai', 'Contemporary ethnic fusion', 'Ishita Malhotra', 'ishita@saffronrow.in'],
  ['Fjord Base Layer', 'Norway', 'Bergen', 'Merino base layers', 'Erik Lund', 'erik@fjordbase.no'],
  ['Palma Kids', 'Portugal', 'Porto', 'Sustainable kidswear', 'Ines Cardoso', 'ines@palmakids.pt'],
]

/** Sales pipeline: leads, the enquiries they become, and the activity log. */
export function buildCrm(random, clients, orders) {
  const leads = PROSPECTS.map((prospect, index) => {
    const [company, country, city, segment, contactName, email] = prospect
    const stage = LEAD_STAGES[index % LEAD_STAGES.length]
    const createdOffset = -random.int(6, 150)
    const value = random.int(40, 620) * 1000
    return {
      id: id('LED', index + 1),
      company,
      contactName,
      contactTitle: random.pick(['Founder', 'Head of Product', 'Sourcing Manager', 'Buying Director', 'Production Lead']),
      email,
      phone: `+${random.int(1, 49)} ${random.int(100, 999)} 555 0${random.int(100, 199)}`,
      country,
      city,
      segment,
      source: LEAD_SOURCES[index % LEAD_SOURCES.length],
      stage,
      estimatedValueUsd: value,
      estimatedQuantity: Math.round(value / random.int(6, 18) / 100) * 100,
      probability: { NEW: 10, CONTACTED: 25, QUALIFIED: 50, PROPOSAL: 70, WON: 100, LOST: 0 }[stage],
      ownerId: ['EMP-005', 'EMP-006', 'EMP-007', 'EMP-008', 'EMP-009', 'EMP-010'][index % 6],
      nextAction:
        stage === 'WON'
          ? 'Convert to enquiry and open a cost sheet'
          : stage === 'LOST'
            ? 'Revisit next season'
            : random.pick([
                'Send the capability deck and factory list',
                'Schedule a video call with the design team',
                'Share indicative FOB for the tee programme',
                'Follow up on the tech pack they promised',
                'Collect the target price and delivery window',
              ]),
      nextActionDate: stage === 'LOST' ? null : day(random.int(1, 21)),
      convertedEnquiryId: stage === 'WON' ? id('ENQ', index + 1) : null,
      createdAt: at(createdOffset, 11),
      updatedAt: at(createdOffset + random.int(1, 20), 15),
      notes:
        stage === 'LOST'
          ? 'Went with an incumbent supplier on price. Worth revisiting for AW27.'
          : 'Volumes look workable for our Tiruppur knit units.',
    }
  })

  // Enquiries: one per order that has progressed past LEAD, plus the won leads.
  const enquiries = orders
    .filter((order) => order.statusIndex >= 1)
    .map((order, index) => ({
      id: id('ENQ', index + 1),
      reference: `ENQ-${2600 + index}`,
      clientId: order.clientId,
      clientName: order.clientName,
      styleName: order.styleName,
      categoryId: order.categoryId,
      quantity: order.quantity,
      targetPrice: round(order.fobPrice * random.float(0.86, 0.98, 2), 2),
      currency: 'USD',
      requiredExFactory: order.exFactoryDate,
      status: order.statusIndex >= 5 ? 'CONVERTED' : order.statusIndex >= 3 ? 'COSTING' : 'OPEN',
      orderId: order.statusIndex >= 5 ? order.id : null,
      ownerId: order.merchandiserId,
      receivedAt: at(-random.int(60, 180), 10),
      brief: `${order.quantity.toLocaleString('en-US')} pcs of ${order.styleName.toLowerCase()} for ${order.season}. Target FOB around $${round(order.fobPrice * 0.92, 2)}.`,
    }))

  const ACTIVITY_TYPES = ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'STATUS_CHANGE']
  const activities = []
  const pushActivity = (entity, entityId, type, summary, offset, actorId) => {
    activities.push({
      id: id('ACT', activities.length + 1, 4),
      entity,
      entityId,
      type,
      summary,
      actorId,
      at: at(offset, random.int(9, 18)),
    })
  }

  leads.forEach((lead, index) => {
    pushActivity('lead', lead.id, 'EMAIL', `Sent the capability deck to ${lead.contactName}.`, -random.int(5, 90), lead.ownerId)
    if (index % 2 === 0) {
      pushActivity('lead', lead.id, 'CALL', `Discovery call — ${lead.segment.toLowerCase()} programme, ${lead.estimatedQuantity.toLocaleString('en-US')} pcs indicative.`, -random.int(3, 60), lead.ownerId)
    }
    if (lead.stage === 'WON') {
      pushActivity('lead', lead.id, 'STATUS_CHANGE', 'Lead converted to an enquiry.', -random.int(1, 20), lead.ownerId)
    }
  })

  orders.slice(0, 22).forEach((order) => {
    pushActivity('order', order.id, 'STATUS_CHANGE', `Status moved to ${order.status.replace(/_/g, ' ').toLowerCase()}.`, -random.int(1, 40), order.merchandiserId)
    pushActivity('order', order.id, 'EMAIL', `Sent the weekly progress update to ${order.clientName}.`, -random.int(1, 14), order.merchandiserId)
    if (order.risk !== 'ON_TRACK') {
      pushActivity('order', order.id, 'NOTE', 'Flagged the delay to the client with a revised ex-factory date.', -random.int(1, 10), order.merchandiserId)
    }
  })

  clients.forEach((client, index) => {
    pushActivity('client', client.id, 'MEETING', `Quarterly business review with ${client.contactName}.`, -random.int(20, 120), client.accountManagerId)
    if (index % 2 === 0) {
      pushActivity('client', client.id, 'NOTE', 'Agreed the seasonal buy calendar for the next two drops.', -random.int(10, 90), client.accountManagerId)
    }
  })

  activities.sort((a, b) => (a.at < b.at ? 1 : -1))
  return { leads, enquiries, activities, ACTIVITY_TYPES }
}

const SAMPLE_TYPES = ['PROTO', 'FIT', 'SIZE_SET', 'PP']
const REJECT_COMMENTS = [
  'Armhole is 1.2 cm over tolerance — correct the pattern and resubmit.',
  'Shade is off against the approved lab dip; re-dye and resubmit with a cutting.',
  'Neck rib is wavy after pressing — check the rib tension.',
  'Print placement sits 2 cm low on the body. Re-place per the tech pack.',
  'Sleeve length graded incorrectly across the size set.',
  'Stitch density below spec on the side seams.',
]
const APPROVE_COMMENTS = [
  'Approved. Proceed to bulk with this construction.',
  'Approved with a comment: keep the same shade continuity in bulk.',
  'Fit approved. Carry the graded spec into the size set.',
  'Approved — trims and labelling match the PP standard.',
]

/** Design requests, tech packs and 60 samples with approval states. */
export function buildDesign(random, orders) {
  const designOrders = orders.filter((order) => order.hasDesign)

  const designRequests = designOrders.map((order, index) => {
    const raisedOffset = -random.int(40, 170)
    const statusIndex = order.statusIndex
    return {
      id: id('DSR', index + 1),
      reference: `DR-${1400 + index}`,
      orderId: order.id,
      poNumber: order.poNumber,
      clientId: order.clientId,
      clientName: order.clientName,
      styleName: order.styleName,
      categoryId: order.categoryId,
      brief: `Develop ${order.styleName.toLowerCase()} for ${order.clientName} — ${order.season}. Carry the client's existing block and update the neck construction.`,
      requestedById: order.merchandiserId,
      assignedToId: ['EMP-012', 'EMP-013', 'EMP-014', 'EMP-015', 'EMP-016'][index % 5],
      priority: order.risk === 'DELAYED' ? 'HIGH' : random.pick(['HIGH', 'NORMAL', 'NORMAL', 'LOW']),
      dueDate: day(raisedOffset + random.int(14, 30)),
      status: statusIndex >= 6 ? 'COMPLETED' : statusIndex >= 3 ? 'IN_PROGRESS' : 'OPEN',
      raisedAt: at(raisedOffset, 10),
    }
  })

  const techPacks = designOrders.map((order, index) => ({
    id: id('TPK', index + 1),
    reference: `TP-${order.styleNumber}`,
    orderId: order.id,
    poNumber: order.poNumber,
    clientId: order.clientId,
    clientName: order.clientName,
    styleName: order.styleName,
    version: order.statusIndex >= 6 ? random.int(2, 4) : 1,
    fabricId: order.fabricId,
    sizeSetId: order.sizeSetId,
    createdById: ['EMP-012', 'EMP-013', 'EMP-014'][index % 3],
    status: order.statusIndex >= 6 ? 'RELEASED' : order.statusIndex >= 3 ? 'IN_REVIEW' : 'DRAFT',
    releasedAt: order.statusIndex >= 6 ? at(-random.int(30, 120), 14) : null,
    measurementPoints: random.int(14, 28),
    bomLines: random.int(6, 14),
    constructionNotes: 'Single needle side seams, twin needle hem, neck taped with self fabric. Care label at the left side seam.',
    updatedAt: at(-random.int(2, 60), 16),
  }))

  // 60 samples spread across the order book, weighted to live orders.
  const samples = []
  const pool = orders.filter((order) => order.statusIndex >= 2)
  for (let index = 0; index < 60; index += 1) {
    const order = pool[index % pool.length]
    const type = SAMPLE_TYPES[index % SAMPLE_TYPES.length]
    const sentOffset = -random.int(4, 150)
    const decided = order.statusIndex >= 7 || random.chance(0.62)
    const rejected = decided && random.chance(0.22)
    const status = !decided ? 'PENDING' : rejected ? 'REJECTED' : 'APPROVED'
    samples.push({
      id: id('SMP', index + 1),
      reference: `SM-${3200 + index}`,
      orderId: order.id,
      poNumber: order.poNumber,
      clientId: order.clientId,
      clientName: order.clientName,
      styleName: order.styleName,
      type,
      version: rejected ? random.int(2, 3) : 1,
      colorId: order.colorIds[0],
      sizeSubmitted: random.pick(['M', 'L', 'S', '8', '4Y']),
      sentAt: at(sentOffset, 11),
      dueAt: day(sentOffset + random.int(7, 14)),
      decidedAt: decided ? at(sentOffset + random.int(3, 12), 15) : null,
      status,
      decidedBy: decided ? 'CLIENT' : null,
      comments: decided
        ? rejected
          ? REJECT_COMMENTS[index % REJECT_COMMENTS.length]
          : APPROVE_COMMENTS[index % APPROVE_COMMENTS.length]
        : '',
      submittedById: ['EMP-012', 'EMP-013', 'EMP-014', 'EMP-015'][index % 4],
      courier: random.pick(['DHL', 'FedEx', 'Aramex']),
      trackingNumber: `${random.int(100000000, 999999999)}`,
    })
  }

  return { designRequests, techPacks, samples }
}

/** Cost sheets with a real FOB build-up, plus the quotations sent from them. */
export function buildCosting(random, orders, fabrics) {
  const fabricById = Object.fromEntries(fabrics.map((fabric) => [fabric.id, fabric]))
  const costSheets = []
  const quotations = []

  orders
    .filter((order) => order.statusIndex >= 3)
    .forEach((order, index) => {
      const fabric = fabricById[order.fabricId]
      const consumption = round(random.float(0.18, 0.62, 3), 3)
      const fabricCost = round(consumption * fabric.standardRate * random.float(1.0, 1.08, 3), 3)
      const trimsCost = round(random.float(0.32, 1.35, 3), 3)
      const cmCost = round(random.float(0.85, 3.4, 3), 3)
      const washCost = order.hasWash ? round(random.float(0.28, 0.75, 3), 3) : 0
      const overhead = round((fabricCost + trimsCost + cmCost + washCost) * random.float(0.06, 0.11, 3), 3)
      const freight = round(random.float(0.06, 0.24, 3), 3)
      const subtotal = round(fabricCost + trimsCost + cmCost + washCost + overhead + freight, 3)
      const marginPercent = round(random.float(11, 24, 1), 1)
      const fobPrice = round(subtotal / (1 - marginPercent / 100), 2)
      const versions = order.statusIndex >= 5 ? random.int(2, 3) : 1

      const sheetId = id('CST', index + 1)
      costSheets.push({
        id: sheetId,
        reference: `CS-${4100 + index}`,
        orderId: order.id,
        poNumber: order.poNumber,
        clientId: order.clientId,
        clientName: order.clientName,
        styleName: order.styleName,
        quantity: order.quantity,
        currency: 'USD',
        version: versions,
        fabricId: order.fabricId,
        consumption,
        consumptionUnit: fabric.uom,
        fabricRate: fabric.standardRate,
        lines: {
          fabric: fabricCost,
          trims: trimsCost,
          cm: cmCost,
          wash: washCost,
          overhead,
          freight,
        },
        subtotal,
        marginPercent,
        fobPrice,
        approvedFobPrice: order.fobPrice,
        totalValue: round(order.quantity * fobPrice, 2),
        status: order.statusIndex >= 5 ? 'APPROVED' : order.statusIndex >= 4 ? 'SENT' : 'DRAFT',
        preparedById: order.merchandiserId,
        approvedById: order.statusIndex >= 5 ? 'EMP-002' : null,
        createdAt: at(-random.int(40, 160), 11),
        updatedAt: at(-random.int(1, 39), 15),
      })

      if (order.statusIndex >= 4) {
        for (let versionIndex = 1; versionIndex <= versions; versionIndex += 1) {
          const isLatest = versionIndex === versions
          const quotedPrice = round(fobPrice * (1 + (versions - versionIndex) * 0.035), 2)
          quotations.push({
            id: id('QTN', quotations.length + 1),
            reference: `QT-${5200 + quotations.length}`,
            costSheetId: sheetId,
            orderId: order.id,
            poNumber: order.poNumber,
            clientId: order.clientId,
            clientName: order.clientName,
            styleName: order.styleName,
            version: versionIndex,
            quantity: order.quantity,
            fobPrice: quotedPrice,
            currency: 'USD',
            totalValue: round(order.quantity * quotedPrice, 2),
            incoterm: order.incoterm,
            paymentTermCode: order.paymentTermCode,
            validUntil: day(-random.int(1, 40) + 30),
            status: !isLatest ? 'SUPERSEDED' : order.statusIndex >= 5 ? 'ACCEPTED' : 'SENT',
            sentAt: at(-random.int(20, 150), 12),
            sentById: order.merchandiserId,
            notes: isLatest ? 'Priced on the approved PP construction and current yarn rates.' : 'Revised after the client asked for a price-down.',
          })
        }
      }
    })

  return { costSheets, quotations }
}

import { at, day, id, round } from './lib.mjs'

/** AR invoices, AP bills, payments and expenses. */
export function buildFinance(random, orders, materialPos, clients, vendors) {
  const clientById = Object.fromEntries(clients.map((client) => [client.id, client]))
  const termDays = { 'TT 30': 30, 'TT 45': 45, 'TT 60': 60, 'LC 60': 60, 'LC 90': 90, '30/70': 15, Advance: 0 }

  const invoices = []
  const payments = []

  /** Record an invoice plus its receipt, if any. */
  const addInvoice = (entry) => {
    invoices.push(entry)
    if (entry.receivedAmount > 0) {
      payments.push({
        id: id('PMT', payments.length + 1),
        type: 'RECEIPT',
        reference: `RCT-${3400 + payments.length}`,
        invoiceId: entry.id,
        billId: null,
        orderId: entry.orderId,
        partyId: entry.clientId,
        partyName: entry.clientName,
        amount: entry.receivedAmount,
        currency: 'USD',
        method: random.pick(['TT', 'TT', 'LC negotiation']),
        paidAt: entry.status === 'PAID' ? entry.dueAt : day(-random.int(1, 30)),
        bankReference: `SWIFT${random.int(10000000, 99999999)}`,
        recordedById: 'EMP-040',
      })
    }
  }

  // Advance invoices go out once the PO is confirmed; the commercial invoice
  // follows the shipment. That is what gives receivables a realistic spread.
  orders
    .filter((order) => order.statusIndex >= 5)
    .forEach((order, index) => {
      const advanceShare = order.paymentTermCode === '30/70' ? 0.3 : 0.2
      const amount = round(order.orderValue * advanceShare, 2)
      const raisedOffset = daysBetween(order.confirmedDate ?? order.enquiryDate) + random.int(1, 5)
      const dueOffset = raisedOffset + 15
      const settled = order.statusIndex >= 8 || dueOffset < -20
      addInvoice({
        id: id('INV', invoices.length + 1),
        number: `INV-2026-A${String(100 + index).padStart(3, '0')}`,
        kind: 'ADVANCE',
        orderId: order.id,
        poNumber: order.poNumber,
        clientId: order.clientId,
        clientName: order.clientName,
        quantity: order.quantity,
        fobPrice: order.fobPrice,
        amount,
        currency: 'USD',
        receivedAmount: settled ? amount : 0,
        balance: settled ? 0 : amount,
        issuedAt: day(raisedOffset),
        dueAt: day(dueOffset),
        paymentTermCode: order.paymentTermCode,
        agingDays: !settled && dueOffset < 0 ? Math.abs(dueOffset) : 0,
        status: settled ? 'PAID' : dueOffset < 0 ? 'OVERDUE' : 'SENT',
        incoterm: order.incoterm,
        raisedById: 'EMP-040',
        notes: `${Math.round(advanceShare * 100)}% advance against the confirmed PO.`,
      })
    })

  orders
    .filter((order) => order.statusIndex >= 10)
    .forEach((order, index) => {
      const client = clientById[order.clientId]
      const raisedOffset = daysBetween(order.shipDate ?? order.exFactoryDate) + 1
      const dueOffset = raisedOffset + (termDays[order.paymentTermCode] ?? 45)
      const advanceShare = order.paymentTermCode === '30/70' ? 0.3 : 0.2
      const amount = round(order.orderValue * (1 - advanceShare), 2)
      const settled = order.statusIndex >= 13
      const partial = !settled && random.chance(0.35)
      const receivedAmount = settled ? amount : partial ? round(amount * random.float(0.3, 0.6, 2), 2) : 0
      const overdue = !settled && dueOffset < 0
      addInvoice({
        id: id('INV', invoices.length + 1),
        number: `INV-2026-${String(100 + index).padStart(4, '0')}`,
        kind: 'COMMERCIAL',
        orderId: order.id,
        poNumber: order.poNumber,
        clientId: order.clientId,
        clientName: order.clientName,
        quantity: order.quantity,
        fobPrice: order.fobPrice,
        amount,
        currency: 'USD',
        receivedAmount,
        balance: round(amount - receivedAmount, 2),
        issuedAt: day(raisedOffset),
        dueAt: day(dueOffset),
        paymentTermCode: order.paymentTermCode,
        agingDays: overdue ? Math.abs(dueOffset) : 0,
        status: settled ? 'PAID' : overdue ? 'OVERDUE' : partial ? 'PARTIAL' : 'SENT',
        incoterm: order.incoterm,
        raisedById: 'EMP-040',
        notes: overdue ? `Chased twice; ${client.contactName} has committed to a date.` : '',
      })
    })

  // Prior-season history so receivables aging and revenue trends have depth.
  for (let index = 0; index < 14; index += 1) {
    const client = clients[index % clients.length]
    const amount = round(random.int(48, 640) * 1000 + random.float(0, 999, 2), 2)
    const raisedOffset = -random.int(95, 330)
    const dueOffset = raisedOffset + (termDays[client.paymentTermCode] ?? 45)
    const settled = random.chance(0.82)
    addInvoice({
      id: id('INV', invoices.length + 1),
      number: `INV-2025-${String(600 + index).padStart(4, '0')}`,
      kind: 'COMMERCIAL',
      orderId: null,
      poNumber: `PO-9${String(index).padStart(3, '0')}`,
      clientId: client.id,
      clientName: client.name,
      quantity: random.int(4, 30) * 1000,
      fobPrice: round(random.float(4.5, 24, 2), 2),
      amount,
      currency: 'USD',
      receivedAmount: settled ? amount : 0,
      balance: settled ? 0 : amount,
      issuedAt: day(raisedOffset),
      dueAt: day(dueOffset),
      paymentTermCode: client.paymentTermCode,
      agingDays: settled ? 0 : Math.abs(dueOffset),
      status: settled ? 'PAID' : 'OVERDUE',
      incoterm: client.incoterm,
      raisedById: 'EMP-040',
      notes: settled ? '' : 'Prior-season balance under dispute over a short shipment.',
      season: 'SS26',
    })
  }

  const vendorById = Object.fromEntries(vendors.map((vendor) => [vendor.id, vendor]))
  const bills = materialPos
    .filter((materialPo) => materialPo.receivedQuantity > 0)
    .map((materialPo, index) => {
      const vendor = vendorById[materialPo.vendorId]
      const amount = round((materialPo.receivedQuantity / materialPo.quantity) * materialPo.totalValue, 2)
      const raisedOffset = daysBetween(materialPo.expectedAt) + 2
      const dueOffset = raisedOffset + (termDays[materialPo.paymentTermCode] ?? 30)
      const settled = dueOffset < -5 && random.chance(0.8)
      return {
        id: id('BIL', index + 1),
        number: `BIL-2026-0${100 + index}`,
        materialPoId: materialPo.id,
        orderId: materialPo.orderId,
        poNumber: materialPo.poNumber,
        vendorId: materialPo.vendorId,
        vendorName: vendor?.name ?? materialPo.vendorId,
        amount,
        currency: 'USD',
        paidAmount: settled ? amount : 0,
        balance: settled ? 0 : amount,
        issuedAt: day(raisedOffset),
        dueAt: day(dueOffset),
        paymentTermCode: materialPo.paymentTermCode,
        status: settled ? 'PAID' : dueOffset < 0 ? 'OVERDUE' : 'SENT',
        approvedById: 'EMP-039',
      }
    })

  bills
    .filter((bill) => bill.paidAmount > 0)
    .forEach((bill) => {
      payments.push({
        id: id('PMT', payments.length + 1),
        type: 'PAYMENT',
        reference: `PAY-${3400 + payments.length}`,
        invoiceId: null,
        billId: bill.id,
        orderId: bill.orderId,
        partyId: bill.vendorId,
        partyName: bill.vendorName,
        amount: bill.paidAmount,
        currency: 'USD',
        method: random.pick(['NEFT', 'RTGS', 'TT']),
        paidAt: bill.dueAt,
        bankReference: `NEFT${random.int(10000000, 99999999)}`,
        recordedById: 'EMP-041',
      })
    })

  const EXPENSE_HEADS = [
    ['Courier & sampling', 'Sampling', 'EMP-012'],
    ['Factory travel', 'Travel', 'EMP-024'],
    ['Third-party inspection', 'Quality', 'EMP-031'],
    ['Customs & CHA charges', 'Logistics', 'EMP-036'],
    ['Lab testing (SGS)', 'Quality', 'EMP-032'],
    ['Office rent — Tiruppur', 'Overhead', 'EMP-039'],
    ['Internet & telecom', 'Overhead', 'EMP-001'],
    ['Trade show — Première Vision', 'Marketing', 'EMP-002'],
    ['Client entertainment', 'Marketing', 'EMP-005'],
    ['Fabric testing & lab dips', 'Sampling', 'EMP-018'],
  ]
  const expenses = Array.from({ length: 36 }, (_, index) => {
    const [head, category, ownerId] = EXPENSE_HEADS[index % EXPENSE_HEADS.length]
    const order = random.chance(0.55) ? random.pick(orders) : null
    const amountInr = random.int(2400, 185000)
    const incurred = -random.int(1, 180)
    return {
      id: id('EXP', index + 1),
      reference: `EXP-${4400 + index}`,
      head,
      category,
      orderId: order?.id ?? null,
      poNumber: order?.poNumber ?? null,
      amount: amountInr,
      currency: 'INR',
      amountUsd: round(amountInr / 88.4, 2),
      incurredAt: day(incurred),
      submittedById: ownerId,
      approvedById: incurred < -6 ? 'EMP-039' : null,
      status: incurred < -6 ? 'APPROVED' : random.chance(0.5) ? 'SUBMITTED' : 'DRAFT',
      billable: Boolean(order) && random.chance(0.4),
      notes: '',
    }
  })

  return { invoices, bills, payments, expenses }
}

const LEAVE_TYPES = ['CASUAL', 'SICK', 'EARNED', 'UNPAID']

/** Attendance for the trailing 45 days, leave requests and one payroll run. */
export function buildHr(random, employees) {
  const attendance = []
  for (let offset = -44; offset <= 0; offset += 1) {
    const date = new Date(at(offset))
    const weekday = date.getUTCDay()
    if (weekday === 0) continue // Sunday off
    for (const employee of employees) {
      const roll = random.next()
      let status = 'PRESENT'
      if (roll > 0.965) status = 'ABSENT'
      else if (roll > 0.93) status = 'LEAVE'
      else if (roll > 0.87) status = 'LATE'
      else if (weekday === 6 && roll > 0.6) status = 'WEEK_OFF'

      const inHour = status === 'LATE' ? 10 : 9
      attendance.push({
        id: `${employee.id}-${day(offset)}`,
        employeeId: employee.id,
        employeeName: employee.name,
        department: employee.department,
        date: day(offset),
        status,
        checkIn: status === 'PRESENT' || status === 'LATE' ? `${String(inHour).padStart(2, '0')}:${String(random.int(0, 55)).padStart(2, '0')}` : null,
        checkOut: status === 'PRESENT' || status === 'LATE' ? `${18 + random.int(0, 2)}:${String(random.int(0, 55)).padStart(2, '0')}` : null,
        hoursWorked: status === 'PRESENT' ? round(random.float(8, 9.8, 1), 1) : status === 'LATE' ? round(random.float(7, 8.4, 1), 1) : 0,
      })
    }
  }

  const leaves = Array.from({ length: 32 }, (_, index) => {
    const employee = employees[(index * 3) % employees.length]
    const from = random.int(-60, 30)
    const days = random.int(1, 5)
    const decided = from < -2
    return {
      id: id('LVE', index + 1),
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department,
      type: LEAVE_TYPES[index % LEAVE_TYPES.length],
      fromDate: day(from),
      toDate: day(from + days - 1),
      days,
      reason: random.pick([
        'Family function out of town',
        'Medical — viral fever',
        'Personal work',
        'Annual leave',
        'Child’s school event',
        'Recovering after a procedure',
      ]),
      status: decided ? (random.chance(0.85) ? 'APPROVED' : 'REJECTED') : 'PENDING',
      appliedAt: at(from - random.int(3, 14), 10),
      decidedById: decided ? employee.reportsTo ?? 'EMP-042' : null,
      decidedAt: decided ? at(from - random.int(1, 3), 12) : null,
      remarks: decided ? '' : 'Awaiting the reporting manager.',
    }
  })

  const payrollMonth = day(-15).slice(0, 7)
  const payroll = employees.map((employee, index) => {
    const basic = Math.round(employee.monthlyCtc * 0.5)
    const hra = Math.round(employee.monthlyCtc * 0.2)
    const allowances = Math.round(employee.monthlyCtc * 0.22)
    const pf = Math.round(basic * 0.12)
    const professionalTax = 208
    const tds = employee.monthlyCtc > 80000 ? Math.round(employee.monthlyCtc * 0.08) : 0
    const lopDays = random.chance(0.12) ? random.int(1, 2) : 0
    const lop = Math.round((employee.monthlyCtc / 26) * lopDays)
    const gross = basic + hra + allowances
    const deductions = pf + professionalTax + tds + lop
    return {
      id: `${payrollMonth}-${employee.id}`,
      month: payrollMonth,
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department,
      grade: employee.grade,
      basic,
      hra,
      allowances,
      gross,
      pf,
      professionalTax,
      tds,
      lopDays,
      lop,
      deductions,
      netPay: gross - deductions,
      currency: 'INR',
      paidAt: day(-13),
      status: 'PAID',
      payslipNumber: `PS-${payrollMonth.replace('-', '')}-${String(index + 1).padStart(3, '0')}`,
    }
  })

  return { attendance, leaves, payroll }
}

const AUDIT_ACTIONS = [
  ['ORDER_STATUS_CHANGED', 'orders', 'Moved {entity} to {detail}'],
  ['SAMPLE_APPROVED', 'design', 'Approved sample {entity}'],
  ['SAMPLE_REJECTED', 'design', 'Rejected sample {entity}'],
  ['COST_SHEET_APPROVED', 'costing', 'Approved cost sheet {entity}'],
  ['QUOTATION_SENT', 'costing', 'Sent quotation {entity} to the client'],
  ['MATERIAL_PO_ISSUED', 'sourcing', 'Issued material PO {entity}'],
  ['GRN_RECORDED', 'sourcing', 'Recorded GRN {entity}'],
  ['INSPECTION_RECORDED', 'quality', 'Recorded inspection {entity} — {detail}'],
  ['SHIPMENT_BOOKED', 'logistics', 'Booked shipment {entity}'],
  ['INVOICE_RAISED', 'finance', 'Raised invoice {entity}'],
  ['PAYMENT_RECEIVED', 'finance', 'Recorded receipt against {entity}'],
  ['USER_ROLE_CHANGED', 'admin', 'Changed the role on {entity} to {detail}'],
  ['PERMISSION_UPDATED', 'admin', 'Updated permissions for {entity}'],
  ['LOGIN', 'auth', 'Signed in'],
]

/** Who changed what, newest first. */
export function buildAuditLog(random, users, orders, samples, invoices) {
  const entries = []
  for (let index = 0; index < 72; index += 1) {
    const [action, module, template] = AUDIT_ACTIONS[index % AUDIT_ACTIONS.length]
    const user = users[index % users.length]
    let entity = '—'
    let detail = ''
    if (module === 'orders') {
      const order = orders[index % orders.length]
      entity = order.poNumber
      detail = order.status.replace(/_/g, ' ').toLowerCase()
    } else if (module === 'design') {
      entity = samples[index % samples.length].reference
    } else if (module === 'finance') {
      entity = invoices.length > 0 ? invoices[index % invoices.length].number : 'INV-2026-0100'
    } else if (module === 'admin') {
      entity = users[(index + 3) % users.length].email
      detail = users[(index + 5) % users.length].role
    } else if (module === 'quality') {
      entity = `QC-${9100 + (index % 20)}`
      detail = random.chance(0.8) ? 'pass' : 'fail'
    } else if (module === 'sourcing') {
      entity = `MPO-${7100 + (index % 30)}`
    } else if (module === 'logistics') {
      entity = `SHP-${9600 + (index % 12)}`
    } else if (module === 'costing') {
      entity = `CS-${4100 + (index % 20)}`
    } else {
      entity = user.email
    }

    entries.push({
      id: id('AUD', index + 1, 4),
      action,
      module,
      entity,
      description: template.replace('{entity}', entity).replace('{detail}', detail),
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      ipAddress: `10.${random.int(0, 4)}.${random.int(1, 40)}.${random.int(2, 250)}`,
      userAgent: random.pick(['Chrome 141 · macOS', 'Chrome 141 · Windows', 'Safari 20 · macOS', 'Edge 141 · Windows']),
      at: at(-random.int(0, 45), random.int(8, 20)),
    })
  }
  entries.sort((a, b) => (a.at < b.at ? 1 : -1))
  return entries
}

/** @param {string} isoDay */
function daysBetween(isoDay) {
  const reference = new Date('2026-09-20T00:00:00.000Z').getTime()
  return Math.round((new Date(`${isoDay}T00:00:00.000Z`).getTime() - reference) / 86400000)
}

import {
  Banknote,
  Box,
  CheckCircle2,
  ClipboardCheck,
  Coins,
  Droplets,
  FileSignature,
  FileText,
  Flag,
  Package,
  PackageCheck,
  PencilRuler,
  Scissors,
  Search,
  Shirt,
  Ship,
  Sparkles,
  Truck,
  UserPlus,
} from 'lucide-react'

/**
 * Single source of truth for every status and stage in the app.
 * `tone` maps onto the Badge tones, which map onto the semantic colour tokens,
 * so a status looks the same everywhere and in both themes.
 */

/** @typedef {'LEAD'|'ENQUIRY'|'DESIGN'|'COSTING'|'QUOTED'|'CONFIRMED'|'SAMPLING'|'SOURCING'|'PRODUCTION'|'QC'|'READY_TO_SHIP'|'SHIPPED'|'DELIVERED'|'PAYMENT_RECEIVED'|'CLOSED'} OrderStatus */

/** Ordered lifecycle — index is the progress position. */
export const ORDER_STATUS_FLOW = [
  'LEAD',
  'ENQUIRY',
  'DESIGN',
  'COSTING',
  'QUOTED',
  'CONFIRMED',
  'SAMPLING',
  'SOURCING',
  'PRODUCTION',
  'QC',
  'READY_TO_SHIP',
  'SHIPPED',
  'DELIVERED',
  'PAYMENT_RECEIVED',
  'CLOSED',
]

/** Statuses that are not part of every order's path. */
export const OPTIONAL_ORDER_STATUSES = ['DESIGN']

export const ORDER_STATUSES = {
  LEAD: { label: 'Lead', tone: 'default', icon: UserPlus, description: 'Unqualified brand interest' },
  ENQUIRY: { label: 'Enquiry', tone: 'default', icon: FileText, description: 'Brief received, being qualified' },
  DESIGN: { label: 'Design', tone: 'info', icon: PencilRuler, description: 'Concepts and tech pack in progress' },
  COSTING: { label: 'Costing', tone: 'info', icon: Coins, description: 'FOB build-up under preparation' },
  QUOTED: { label: 'Quoted', tone: 'info', icon: FileSignature, description: 'Quotation sent, awaiting the brand' },
  CONFIRMED: { label: 'Confirmed', tone: 'primary', icon: CheckCircle2, description: 'PO received and accepted' },
  SAMPLING: { label: 'Sampling', tone: 'primary', icon: Shirt, description: 'Fit, size set and PP samples' },
  SOURCING: { label: 'Sourcing', tone: 'primary', icon: Box, description: 'Fabric and trims on order' },
  PRODUCTION: { label: 'Production', tone: 'warning', icon: Scissors, description: 'On the floor' },
  QC: { label: 'QC', tone: 'warning', icon: ClipboardCheck, description: 'Final inspection in progress' },
  READY_TO_SHIP: { label: 'Ready to ship', tone: 'success', icon: PackageCheck, description: 'Packed and awaiting booking' },
  SHIPPED: { label: 'Shipped', tone: 'success', icon: Ship, description: 'On the water or in the air' },
  DELIVERED: { label: 'Delivered', tone: 'success', icon: Truck, description: 'Received at destination' },
  PAYMENT_RECEIVED: { label: 'Payment received', tone: 'success', icon: Banknote, description: 'Invoice settled' },
  CLOSED: { label: 'Closed', tone: 'default', icon: Flag, description: 'Order archived' },
}

/** Ordered production stages. WASHING_EMB is skipped unless the style needs it. */
export const PRODUCTION_STAGE_FLOW = [
  'FABRIC_INHOUSE',
  'CUTTING',
  'STITCHING',
  'WASHING_EMB',
  'FINISHING',
  'PACKING',
  'FINAL_INSPECTION',
]

export const PRODUCTION_STAGES = {
  FABRIC_INHOUSE: { label: 'Fabric in-house', short: 'Fabric', tone: 'info', icon: Box, optional: false },
  CUTTING: { label: 'Cutting', short: 'Cutting', tone: 'info', icon: Scissors, optional: false },
  STITCHING: { label: 'Stitching', short: 'Stitching', tone: 'primary', icon: Shirt, optional: false },
  WASHING_EMB: { label: 'Washing / embellishment', short: 'Wash', tone: 'primary', icon: Droplets, optional: true },
  FINISHING: { label: 'Finishing', short: 'Finishing', tone: 'warning', icon: Sparkles, optional: false },
  PACKING: { label: 'Packing', short: 'Packing', tone: 'warning', icon: Package, optional: false },
  FINAL_INSPECTION: { label: 'Final inspection', short: 'Final QC', tone: 'success', icon: Search, optional: false },
}

/** Status of a single production stage. */
export const STAGE_STATUSES = {
  NOT_STARTED: { label: 'Not started', tone: 'default' },
  IN_PROGRESS: { label: 'In progress', tone: 'primary' },
  DELAYED: { label: 'Delayed', tone: 'danger' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  SKIPPED: { label: 'Skipped', tone: 'default' },
}

export const SAMPLE_TYPES = {
  PROTO: { label: 'Proto', description: 'First concept in available fabric' },
  FIT: { label: 'Fit', description: 'Measurement and fit approval' },
  SIZE_SET: { label: 'Size set', description: 'Graded sizes across the run' },
  PP: { label: 'PP', description: 'Pre-production, actual fabric and trims' },
}

export const APPROVAL_STATUSES = {
  PENDING: { label: 'Pending', tone: 'warning', icon: ClipboardCheck },
  APPROVED: { label: 'Approved', tone: 'success', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', tone: 'danger', icon: Flag },
}

export const RISK_LEVELS = {
  ON_TRACK: { label: 'On track', tone: 'success' },
  AT_RISK: { label: 'At risk', tone: 'warning' },
  DELAYED: { label: 'Delayed', tone: 'danger' },
}

export const LEAD_STAGES = {
  NEW: { label: 'New', tone: 'default' },
  CONTACTED: { label: 'Contacted', tone: 'info' },
  QUALIFIED: { label: 'Qualified', tone: 'primary' },
  PROPOSAL: { label: 'Proposal', tone: 'warning' },
  WON: { label: 'Won', tone: 'success' },
  LOST: { label: 'Lost', tone: 'danger' },
}

export const INVOICE_STATUSES = {
  DRAFT: { label: 'Draft', tone: 'default' },
  SENT: { label: 'Sent', tone: 'info' },
  PARTIAL: { label: 'Part paid', tone: 'warning' },
  PAID: { label: 'Paid', tone: 'success' },
  OVERDUE: { label: 'Overdue', tone: 'danger' },
}

export const PO_STATUSES = {
  DRAFT: { label: 'Draft', tone: 'default' },
  ISSUED: { label: 'Issued', tone: 'info' },
  PARTIAL: { label: 'Part received', tone: 'warning' },
  RECEIVED: { label: 'Received', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'danger' },
}

export const SHIPMENT_STATUSES = {
  PLANNED: { label: 'Planned', tone: 'default' },
  BOOKED: { label: 'Booked', tone: 'info' },
  IN_TRANSIT: { label: 'In transit', tone: 'primary' },
  ARRIVED: { label: 'Arrived', tone: 'success' },
  DELIVERED: { label: 'Delivered', tone: 'success' },
}

export const INSPECTION_RESULTS = {
  PASS: { label: 'Pass', tone: 'success' },
  FAIL: { label: 'Fail', tone: 'danger' },
  PENDING: { label: 'Pending', tone: 'warning' },
}

/** Every registry the StatusBadge can read from, keyed by `kind`. */
export const STATUS_REGISTRY = {
  order: ORDER_STATUSES,
  stage: PRODUCTION_STAGES,
  stageStatus: STAGE_STATUSES,
  sample: SAMPLE_TYPES,
  approval: APPROVAL_STATUSES,
  risk: RISK_LEVELS,
  lead: LEAD_STAGES,
  invoice: INVOICE_STATUSES,
  po: PO_STATUSES,
  shipment: SHIPMENT_STATUSES,
  inspection: INSPECTION_RESULTS,
}

/**
 * Look up the presentation of a status value.
 * @param {keyof typeof STATUS_REGISTRY} kind
 * @param {string} value
 * @returns {{label: string, tone: string, icon?: import('react').ElementType}}
 */
export function statusMeta(kind, value) {
  const registry = STATUS_REGISTRY[kind] ?? {}
  return (
    registry[value] ?? {
      label: String(value ?? '—')
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase()),
      tone: 'default',
    }
  )
}

/**
 * How far through the lifecycle an order is.
 * @param {string} status
 * @returns {number} index in ORDER_STATUS_FLOW, or -1
 */
export function orderStatusIndex(status) {
  return ORDER_STATUS_FLOW.indexOf(status)
}

/**
 * Lifecycle steps for the Stepper, dropping optional stages the order skipped.
 * @param {{status: string, hasDesign?: boolean}} order
 */
export function orderLifecycleSteps(order) {
  return ORDER_STATUS_FLOW.filter(
    (status) => !OPTIONAL_ORDER_STATUSES.includes(status) || order?.hasDesign,
  ).map((status) => ({ value: status, label: ORDER_STATUSES[status].label }))
}

/**
 * Production stages that apply to an order.
 * @param {{hasWash?: boolean}} order
 * @returns {string[]}
 */
export function productionStagesFor(order) {
  return PRODUCTION_STAGE_FLOW.filter(
    (stage) => !PRODUCTION_STAGES[stage].optional || order?.hasWash,
  )
}

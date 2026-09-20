import {
  Banknote,
  BarChart3,
  Boxes,
  ClipboardCheck,
  Factory,
  Handshake,
  LayoutDashboard,
  MessageSquare,
  Package,
  PencilRuler,
  Settings,
  Ship,
  Table2,
  Users,
} from 'lucide-react'

/**
 * @typedef {Object} NavItem
 * @property {string} label
 * @property {string} to
 * @property {string} module  key used by config/permissions.js
 * @property {import('react').ElementType} [icon]
 *
 * @typedef {Object} NavGroup
 * @property {string} label
 * @property {import('react').ElementType} icon
 * @property {string} module   group-level module used for the visibility check
 * @property {string} [to]     set when the group is a single link
 * @property {NavItem[]} [children]
 */

/** @type {NavGroup[]} */
export const navigation = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    module: 'dashboard',
    to: '/app/dashboard',
  },
  {
    label: 'CRM',
    icon: Handshake,
    module: 'crm',
    children: [
      { label: 'Leads', to: '/app/crm/leads', module: 'crm' },
      { label: 'Clients', to: '/app/crm/clients', module: 'crm' },
      { label: 'Enquiries', to: '/app/crm/enquiries', module: 'crm' },
    ],
  },
  {
    label: 'Design',
    icon: PencilRuler,
    module: 'design',
    children: [
      { label: 'Design requests', to: '/app/design/requests', module: 'design' },
      { label: 'Tech packs', to: '/app/design/tech-packs', module: 'design' },
      { label: 'Samples', to: '/app/design/samples', module: 'design' },
    ],
  },
  {
    label: 'Costing',
    icon: Table2,
    module: 'costing',
    children: [
      { label: 'Cost sheets', to: '/app/costing/cost-sheets', module: 'costing' },
      { label: 'Quotations', to: '/app/costing/quotations', module: 'costing' },
    ],
  },
  {
    label: 'Orders',
    icon: Package,
    module: 'orders',
    to: '/app/orders',
  },
  {
    label: 'Sourcing',
    icon: Boxes,
    module: 'sourcing',
    children: [
      { label: 'Vendors', to: '/app/sourcing/vendors', module: 'sourcing' },
      { label: 'RFQ', to: '/app/sourcing/rfq', module: 'sourcing' },
      { label: 'Quote comparison', to: '/app/sourcing/quote-comparison', module: 'sourcing' },
      { label: 'Material PO', to: '/app/sourcing/material-po', module: 'sourcing' },
      { label: 'GRN', to: '/app/sourcing/grn', module: 'sourcing' },
    ],
  },
  {
    label: 'Production',
    icon: Factory,
    module: 'production',
    children: [
      { label: 'Allocation', to: '/app/production/allocation', module: 'production' },
      { label: 'Stage tracker', to: '/app/production/tracker', module: 'production' },
      { label: 'Daily output', to: '/app/production/daily-output', module: 'production' },
      { label: 'Gantt', to: '/app/production/gantt', module: 'production' },
    ],
  },
  {
    label: 'Quality',
    icon: ClipboardCheck,
    module: 'quality',
    children: [
      { label: 'Inspections', to: '/app/quality/inspections', module: 'quality' },
      { label: 'Defect log', to: '/app/quality/defects', module: 'quality' },
    ],
  },
  {
    label: 'Logistics',
    icon: Ship,
    module: 'logistics',
    children: [
      { label: 'Shipments', to: '/app/logistics/shipments', module: 'logistics' },
      { label: 'Documents', to: '/app/logistics/documents', module: 'logistics' },
      { label: 'Tracking', to: '/app/logistics/tracking', module: 'logistics' },
    ],
  },
  {
    label: 'Client updates',
    icon: MessageSquare,
    module: 'clientUpdates',
    to: '/app/client-updates',
  },
  {
    label: 'Finance',
    icon: Banknote,
    module: 'finance',
    children: [
      { label: 'Invoices (AR)', to: '/app/finance/invoices', module: 'finance' },
      { label: 'Bills (AP)', to: '/app/finance/bills', module: 'finance' },
      { label: 'Payments', to: '/app/finance/payments', module: 'finance' },
      { label: 'Expenses', to: '/app/finance/expenses', module: 'finance' },
      { label: 'Order P&L', to: '/app/finance/order-pnl', module: 'finance' },
    ],
  },
  {
    label: 'HR',
    icon: Users,
    module: 'hr',
    children: [
      { label: 'Employees', to: '/app/hr/employees', module: 'hr' },
      { label: 'Departments', to: '/app/hr/departments', module: 'hr' },
      { label: 'Attendance', to: '/app/hr/attendance', module: 'hr' },
      { label: 'Leave', to: '/app/hr/leave', module: 'hr' },
      { label: 'Payroll', to: '/app/hr/payroll', module: 'hr' },
    ],
  },
  {
    label: 'Reports',
    icon: BarChart3,
    module: 'reports',
    to: '/app/reports',
  },
  {
    label: 'Masters',
    icon: Settings,
    module: 'masters',
    children: [
      { label: 'Company', to: '/app/masters/company', module: 'masters' },
      { label: 'Clients', to: '/app/masters/clients', module: 'masters' },
      { label: 'Vendors', to: '/app/masters/vendors', module: 'masters' },
      { label: 'Categories', to: '/app/masters/categories', module: 'masters' },
      { label: 'Fabrics', to: '/app/masters/fabrics', module: 'masters' },
      { label: 'Trims', to: '/app/masters/trims', module: 'masters' },
      { label: 'Colors', to: '/app/masters/colors', module: 'masters' },
      { label: 'Size sets', to: '/app/masters/size-sets', module: 'masters' },
      { label: 'UOM', to: '/app/masters/uom', module: 'masters' },
      { label: 'Currencies', to: '/app/masters/currencies', module: 'masters' },
      { label: 'Ports', to: '/app/masters/ports', module: 'masters' },
      { label: 'Incoterms', to: '/app/masters/incoterms', module: 'masters' },
      { label: 'Payment terms', to: '/app/masters/payment-terms', module: 'masters' },
      { label: 'Stages', to: '/app/masters/stages', module: 'masters' },
      { label: 'QC checklists', to: '/app/masters/qc-checklists', module: 'masters' },
    ],
  },
  {
    label: 'Admin',
    icon: Settings,
    module: 'admin',
    children: [
      { label: 'Users', to: '/app/admin/users', module: 'admin' },
      { label: 'Roles', to: '/app/admin/roles', module: 'admin' },
      { label: 'Audit log', to: '/app/admin/audit-log', module: 'admin' },
      { label: 'Settings', to: '/app/admin/settings', module: 'admin' },
    ],
  },
]

/** Navigation for the client portal (CLIENT role). */
export const portalNavigation = [
  { label: 'My orders', to: '/portal/orders', icon: Package, module: 'portal' },
  { label: 'Approvals', to: '/portal/approvals', icon: ClipboardCheck, module: 'portal' },
  { label: 'Shipments', to: '/portal/shipments', icon: Ship, module: 'portal' },
]

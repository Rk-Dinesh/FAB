import { orderService } from '@/services/orderService'
import { getVendorPerformance } from '@/services/sourcingService'
import { getOrderPnl, invoiceService } from '@/services/financeService'
import { inspectionService } from '@/services/qualityService'
import { sampleService } from '@/services/designService'
import { dailyOutputService } from '@/services/productionService'
import { formatCurrency, formatDate, formatNumber, formatPercent } from '@/utils/format'

/**
 * Every report is a loader plus a column list, so the Reports page is one
 * generic screen and adding a report is a config entry.
 *
 * @typedef {Object} ReportDefinition
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} module      permission module gating the report
 * @property {() => Promise<Array<object>>} load
 * @property {Array<object>} columns  TanStack column defs
 * @property {Array<object>} [filters] FilterBar config
 * @property {(rows: Array<object>) => Array<{label: string, value: string}>} [summary]
 */

/** @type {ReportDefinition[]} */
export const reportDefinitions = [
  {
    id: 'order-book',
    name: 'Order book',
    description: 'Every order with quantity, value, dates and current risk.',
    module: 'orders',
    load: () => orderService.list(),
    filters: [
      {
        key: 'risk',
        label: 'Risk',
        width: 'w-40',
        options: [
          { value: 'ON_TRACK', label: 'On track' },
          { value: 'AT_RISK', label: 'At risk' },
          { value: 'DELAYED', label: 'Delayed' },
        ],
      },
      { key: 'exFactoryDate', label: 'Ex-factory', type: 'dateRange' },
    ],
    columns: [
      { accessorKey: 'poNumber', header: 'PO' },
      { accessorKey: 'clientName', header: 'Client' },
      { accessorKey: 'styleName', header: 'Style' },
      { accessorKey: 'status', header: 'Status' },
      {
        accessorKey: 'quantity',
        header: 'Qty',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatNumber(getValue()),
      },
      {
        accessorKey: 'orderValue',
        header: 'Value',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD'),
      },
      {
        accessorKey: 'exFactoryDate',
        header: 'Ex-factory',
        cell: ({ getValue }) => formatDate(getValue()),
      },
      { accessorKey: 'risk', header: 'Risk' },
      { accessorKey: 'season', header: 'Season' },
    ],
    summary: (rows) => [
      { label: 'Orders', value: formatNumber(rows.length) },
      { label: 'Units', value: formatNumber(rows.reduce((sum, row) => sum + row.quantity, 0)) },
      {
        label: 'Value',
        value: formatCurrency(
          rows.reduce((sum, row) => sum + row.orderValue, 0),
          'USD',
          { compact: true },
        ),
      },
      {
        label: 'Delayed',
        value: formatNumber(rows.filter((row) => row.risk === 'DELAYED').length),
      },
    ],
  },

  {
    id: 'order-margin',
    name: 'Order margin',
    description: 'Revenue against material, CMT, freight and overhead per order.',
    module: 'finance',
    load: () => getOrderPnl(),
    columns: [
      { accessorKey: 'poNumber', header: 'PO' },
      { accessorKey: 'clientName', header: 'Client' },
      {
        accessorKey: 'revenue',
        header: 'Revenue',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD'),
      },
      {
        accessorKey: 'cost',
        header: 'Cost',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD'),
      },
      {
        accessorKey: 'grossMargin',
        header: 'Margin',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD'),
      },
      {
        accessorKey: 'marginPercent',
        header: 'Margin %',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatPercent(getValue()),
      },
      {
        accessorKey: 'outstanding',
        header: 'Outstanding',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD'),
      },
    ],
    summary: (rows) => {
      const revenue = rows.reduce((sum, row) => sum + row.revenue, 0)
      const cost = rows.reduce((sum, row) => sum + row.cost, 0)
      return [
        { label: 'Orders', value: formatNumber(rows.length) },
        { label: 'Revenue', value: formatCurrency(revenue, 'USD', { compact: true }) },
        { label: 'Margin', value: formatCurrency(revenue - cost, 'USD', { compact: true }) },
        {
          label: 'Margin %',
          value: formatPercent(revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0),
        },
      ]
    },
  },

  {
    id: 'vendor-performance',
    name: 'Vendor performance',
    description: 'On-time delivery, defect rate and inspection pass rate by vendor.',
    module: 'sourcing',
    load: () => getVendorPerformance(),
    filters: [
      {
        key: 'type',
        label: 'Type',
        options: [
          { value: 'MILL', label: 'Mill' },
          { value: 'TRIMS', label: 'Trims' },
          { value: 'FACTORY', label: 'Factory' },
          { value: 'WASHING', label: 'Washing' },
        ],
      },
    ],
    columns: [
      { accessorKey: 'name', header: 'Vendor' },
      { accessorKey: 'typeLabel', header: 'Type' },
      { accessorKey: 'city', header: 'City' },
      { accessorKey: 'rating', header: 'Rating', meta: { align: 'right' } },
      {
        accessorKey: 'onTimePercent',
        header: 'On time %',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatPercent(getValue(), 0),
      },
      {
        accessorKey: 'defectRatePercent',
        header: 'Defect %',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatPercent(getValue()),
      },
      { accessorKey: 'activeOrders', header: 'Live orders', meta: { align: 'right' } },
      { accessorKey: 'delayedStages', header: 'Delayed stages', meta: { align: 'right' } },
    ],
    summary: (rows) => [
      { label: 'Vendors', value: formatNumber(rows.length) },
      {
        label: 'Avg on-time',
        value: formatPercent(
          rows.length > 0 ? rows.reduce((sum, row) => sum + row.onTimePercent, 0) / rows.length : 0,
          0,
        ),
      },
      {
        label: 'Under review',
        value: formatNumber(rows.filter((row) => row.onTimePercent < 82).length),
      },
    ],
  },

  {
    id: 'quality',
    name: 'Inspection results',
    description: 'Every AQL inspection with its accept/reject numbers and outcome.',
    module: 'quality',
    load: () => inspectionService.list(),
    filters: [
      {
        key: 'result',
        label: 'Result',
        width: 'w-40',
        options: [
          { value: 'PASS', label: 'Pass' },
          { value: 'FAIL', label: 'Fail' },
        ],
      },
      { key: 'inspectedAt', label: 'Inspected', type: 'dateRange' },
    ],
    columns: [
      { accessorKey: 'reference', header: 'Inspection' },
      { accessorKey: 'poNumber', header: 'PO' },
      { accessorKey: 'clientName', header: 'Client' },
      { accessorKey: 'type', header: 'Type' },
      {
        accessorKey: 'offeredQuantity',
        header: 'Offered',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatNumber(getValue()),
      },
      { accessorKey: 'sampleSize', header: 'Sample', meta: { align: 'right' } },
      { accessorKey: 'defectsFound', header: 'Defects', meta: { align: 'right' } },
      { accessorKey: 'result', header: 'Result' },
      {
        accessorKey: 'inspectedAt',
        header: 'Date',
        cell: ({ getValue }) => formatDate(getValue()),
      },
    ],
    summary: (rows) => [
      { label: 'Inspections', value: formatNumber(rows.length) },
      {
        label: 'Pass rate',
        value: formatPercent(
          rows.length > 0
            ? (rows.filter((row) => row.result === 'PASS').length / rows.length) * 100
            : 0,
          0,
        ),
      },
      { label: 'Failed', value: formatNumber(rows.filter((row) => row.result === 'FAIL').length) },
    ],
  },

  {
    id: 'sample-approvals',
    name: 'Sample approvals',
    description: 'Submission-to-decision record for every sample.',
    module: 'design',
    load: () => sampleService.list(),
    filters: [
      {
        key: 'status',
        label: 'Decision',
        width: 'w-44',
        options: [
          { value: 'PENDING', label: 'Pending' },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'REJECTED', label: 'Rejected' },
        ],
      },
      {
        key: 'type',
        label: 'Type',
        width: 'w-40',
        options: [
          { value: 'PROTO', label: 'Proto' },
          { value: 'FIT', label: 'Fit' },
          { value: 'SIZE_SET', label: 'Size set' },
          { value: 'PP', label: 'PP' },
        ],
      },
    ],
    columns: [
      { accessorKey: 'reference', header: 'Sample' },
      { accessorKey: 'poNumber', header: 'PO' },
      { accessorKey: 'clientName', header: 'Client' },
      { accessorKey: 'type', header: 'Type' },
      { accessorKey: 'version', header: 'Version', meta: { align: 'right' } },
      { accessorKey: 'sentAt', header: 'Sent', cell: ({ getValue }) => formatDate(getValue()) },
      {
        accessorKey: 'decidedAt',
        header: 'Decided',
        cell: ({ getValue }) => (getValue() ? formatDate(getValue()) : '—'),
      },
      { accessorKey: 'status', header: 'Decision' },
    ],
    summary: (rows) => [
      { label: 'Samples', value: formatNumber(rows.length) },
      {
        label: 'Approved',
        value: formatNumber(rows.filter((row) => row.status === 'APPROVED').length),
      },
      {
        label: 'Rejected',
        value: formatNumber(rows.filter((row) => row.status === 'REJECTED').length),
      },
      {
        label: 'Pending',
        value: formatNumber(rows.filter((row) => row.status === 'PENDING').length),
      },
    ],
  },

  {
    id: 'production-output',
    name: 'Production output',
    description: 'Daily line output against target, with efficiency.',
    module: 'production',
    load: () => dailyOutputService.list(),
    filters: [
      { key: 'date', label: 'Date', type: 'dateRange' },
      {
        key: 'stage',
        label: 'Stage',
        options: [
          { value: 'CUTTING', label: 'Cutting' },
          { value: 'STITCHING', label: 'Stitching' },
          { value: 'FINISHING', label: 'Finishing' },
          { value: 'PACKING', label: 'Packing' },
        ],
      },
    ],
    columns: [
      { accessorKey: 'date', header: 'Date', cell: ({ getValue }) => formatDate(getValue()) },
      { accessorKey: 'poNumber', header: 'PO' },
      { accessorKey: 'stage', header: 'Stage' },
      { accessorKey: 'lines', header: 'Lines', meta: { align: 'right' } },
      { accessorKey: 'manpower', header: 'Manpower', meta: { align: 'right' } },
      {
        accessorKey: 'target',
        header: 'Target',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatNumber(getValue()),
      },
      {
        accessorKey: 'produced',
        header: 'Produced',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatNumber(getValue()),
      },
      {
        accessorKey: 'efficiencyPercent',
        header: 'Efficiency',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatPercent(getValue(), 0),
      },
    ],
    summary: (rows) => {
      const produced = rows.reduce((sum, row) => sum + row.produced, 0)
      const target = rows.reduce((sum, row) => sum + row.target, 0)
      return [
        { label: 'Records', value: formatNumber(rows.length) },
        { label: 'Produced', value: formatNumber(produced) },
        { label: 'Target', value: formatNumber(target) },
        { label: 'Efficiency', value: formatPercent(target > 0 ? (produced / target) * 100 : 0, 0) },
      ]
    },
  },

  {
    id: 'receivables',
    name: 'Receivables',
    description: 'Open invoices by client, with aging.',
    module: 'finance',
    load: () => invoiceService.list(),
    filters: [
      {
        key: 'status',
        label: 'Status',
        options: [
          { value: 'SENT', label: 'Sent' },
          { value: 'PARTIAL', label: 'Part paid' },
          { value: 'PAID', label: 'Paid' },
          { value: 'OVERDUE', label: 'Overdue' },
        ],
      },
    ],
    columns: [
      { accessorKey: 'number', header: 'Invoice' },
      { accessorKey: 'clientName', header: 'Client' },
      { accessorKey: 'poNumber', header: 'PO' },
      {
        accessorKey: 'amount',
        header: 'Amount',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD'),
      },
      {
        accessorKey: 'balance',
        header: 'Balance',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD'),
      },
      { accessorKey: 'dueAt', header: 'Due', cell: ({ getValue }) => formatDate(getValue()) },
      { accessorKey: 'agingDays', header: 'Days overdue', meta: { align: 'right' } },
      { accessorKey: 'status', header: 'Status' },
    ],
    summary: (rows) => [
      { label: 'Invoices', value: formatNumber(rows.length) },
      {
        label: 'Invoiced',
        value: formatCurrency(
          rows.reduce((sum, row) => sum + row.amount, 0),
          'USD',
          { compact: true },
        ),
      },
      {
        label: 'Outstanding',
        value: formatCurrency(
          rows.reduce((sum, row) => sum + row.balance, 0),
          'USD',
          { compact: true },
        ),
      },
      {
        label: 'Overdue',
        value: formatNumber(rows.filter((row) => row.status === 'OVERDUE').length),
      },
    ],
  },
]

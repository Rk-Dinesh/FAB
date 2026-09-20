import { Boxes } from 'lucide-react'
import { Badge } from '@/components/ui'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'
import { Field, MiniTable, Panel, TabEmpty } from './TabShell'

/** Order 360 → Sourcing: materials, vendors, POs and goods received. */
export function SourcingTab({ order, vendorsById }) {
  const pos = order.materialPos ?? []
  const grns = order.grns ?? []
  const rfqs = order.rfqs ?? []

  const committed = pos.reduce((sum, po) => sum + po.totalValue, 0)
  const receivedValue = pos.reduce(
    (sum, po) => sum + (po.receivedQuantity / po.quantity) * po.totalValue,
    0,
  )
  const vendorName = (id) => vendorsById?.[id]?.name ?? id

  return (
    <div className="flex flex-col gap-4">
      <Panel title="Material position">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Material POs" value={pos.length} />
          <Field label="Committed" value={formatCurrency(committed, 'USD')} />
          <Field
            label="Received"
            value={formatCurrency(receivedValue, 'USD')}
            hint={committed > 0 ? `${((receivedValue / committed) * 100).toFixed(0)}% of commitment` : undefined}
          />
          <Field
            label="Material cost / pc"
            value={order.quantity > 0 ? formatCurrency(committed / order.quantity, 'USD', { decimals: 3 }) : '—'}
            hint={`vs FOB ${formatCurrency(order.fobPrice, 'USD', { decimals: 2 })}`}
          />
        </dl>
      </Panel>

      <Panel
        title="Purchase orders"
        description="Fabric and trims ordered against this style."
        padded={pos.length === 0}
      >
        {pos.length === 0 ? (
          <TabEmpty
            icon={Boxes}
            title="No material POs yet"
            description="POs are issued once the RFQ is awarded."
          />
        ) : (
          <MiniTable
            head={[
              'PO',
              'Vendor',
              'Material',
              { label: 'Ordered', align: 'right' },
              { label: 'Received', align: 'right' },
              { label: 'Value', align: 'right' },
              'Expected',
              'Status',
            ]}
          >
            {pos.map((po) => (
              <tr key={po.id} className="border-b border-border last:border-0">
                <th scope="row" className="px-3 py-2 text-left font-medium text-text">
                  {po.reference}
                </th>
                <td className="px-3 py-2 text-text">{vendorName(po.vendorId)}</td>
                <td className="px-3 py-2">
                  <span className="flex flex-col leading-tight">
                    <span className="text-text">{po.materialName}</span>
                    <Badge size="sm" tone="outline" className="mt-0.5 w-fit">
                      {po.materialType}
                    </Badge>
                  </span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-text">
                  {formatNumber(po.quantity)} {po.uom}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-text">
                  {formatNumber(po.receivedQuantity)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-text">
                  {formatCurrency(po.totalValue, 'USD', { compact: true })}
                </td>
                <td className="px-3 py-2 text-text">{formatDate(po.expectedAt)}</td>
                <td className="px-3 py-2">
                  <StatusBadge kind="po" value={po.status} size="sm" />
                </td>
              </tr>
            ))}
          </MiniTable>
        )}
      </Panel>

      {grns.length > 0 && (
        <Panel title="Goods received" description="What actually arrived at the unit." padded={false}>
          <MiniTable
            head={[
              'GRN',
              'Material',
              { label: 'Ordered', align: 'right' },
              { label: 'Received', align: 'right' },
              { label: 'Short', align: 'right' },
              'Inspection',
              'Remarks',
            ]}
          >
            {grns.map((grn) => (
              <tr key={grn.id} className="border-b border-border last:border-0">
                <th scope="row" className="px-3 py-2 text-left font-medium text-text">
                  {grn.reference}
                </th>
                <td className="px-3 py-2 text-text">{grn.materialName}</td>
                <td className="px-3 py-2 text-right tabular-nums text-text">
                  {formatNumber(grn.orderedQuantity)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-text">
                  {formatNumber(grn.receivedQuantity)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {grn.shortfallQuantity > 0 ? (
                    <span className="font-medium text-danger">{formatNumber(grn.shortfallQuantity)}</span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <Badge tone={grn.inspectionResult === 'PASS' ? 'success' : 'warning'} size="sm" dot>
                    {grn.inspectionResult === 'PASS' ? 'Pass' : 'Conditional'}
                  </Badge>
                </td>
                <td className="max-w-sm px-3 py-2 text-xs text-muted">{grn.remarks}</td>
              </tr>
            ))}
          </MiniTable>
        </Panel>
      )}

      {rfqs.length > 0 && (
        <Panel title="RFQs" description="Quotes requested for this order's materials." padded={false}>
          <MiniTable
            head={['RFQ', 'Material', { label: 'Quantity', align: 'right' }, 'Required by', 'Vendors', 'Status']}
          >
            {rfqs.map((rfq) => (
              <tr key={rfq.id} className="border-b border-border last:border-0">
                <th scope="row" className="px-3 py-2 text-left font-medium text-text">
                  {rfq.reference}
                </th>
                <td className="px-3 py-2 text-text">{rfq.materialName}</td>
                <td className="px-3 py-2 text-right tabular-nums text-text">
                  {formatNumber(rfq.quantity)} {rfq.uom}
                </td>
                <td className="px-3 py-2 text-text">{formatDate(rfq.requiredBy)}</td>
                <td className="px-3 py-2 text-muted">{rfq.invitedVendorIds.length} invited</td>
                <td className="px-3 py-2">
                  <Badge tone={rfq.status === 'AWARDED' ? 'success' : 'info'} size="sm" dot>
                    {rfq.status.replace('_', ' ').toLowerCase()}
                  </Badge>
                </td>
              </tr>
            ))}
          </MiniTable>
        </Panel>
      )}
    </div>
  )
}

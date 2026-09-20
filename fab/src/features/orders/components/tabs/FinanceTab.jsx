import { useCallback } from 'react'
import { Banknote } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Progress } from '@/components/ui'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useAsync } from '@/hooks'
import { ErrorState } from '@/components/shared/ErrorState'
import { getOrderPnl } from '@/services/financeService'
import { formatCurrency, formatDate, formatPercent } from '@/utils/format'
import { Field, MiniTable, Panel, TabEmpty } from './TabShell'

/** Order 360 → Finance: invoiced, received, vendor cost and the resulting margin. */
export function FinanceTab({ order, vendorsById }) {
  const load = useCallback(() => getOrderPnl(order.id), [order.id])
  const { data: pnl, loading, error, reload } = useAsync(load, [order.id])

  const invoices = order.invoices ?? []
  const bills = order.bills ?? []
  const received = invoices.reduce((sum, invoice) => sum + invoice.receivedAmount, 0)
  const invoiced = invoices.reduce((sum, invoice) => sum + invoice.amount, 0)

  const costLines = pnl
    ? [
        { label: 'Materials', value: pnl.material },
        { label: 'CMT', value: pnl.cmt },
        { label: 'Freight', value: pnl.freight },
        { label: 'Overhead', value: pnl.overhead },
      ]
    : []

  return (
    <div className="flex flex-col gap-4">
      <Panel title="Order P&L" description="Revenue against everything it cost to deliver.">
        {error ? (
          <ErrorState error={error} onRetry={reload} title="Couldn’t calculate the P&L" compact />
        ) : loading || !pnl ? (
          <p className="text-sm text-muted">Calculating…</p>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Revenue" value={formatCurrency(pnl.revenue, 'USD')} />
              <Field label="Total cost" value={formatCurrency(pnl.cost, 'USD')} />
              <Field
                label="Gross margin"
                value={formatCurrency(pnl.grossMargin, 'USD')}
                tone={pnl.grossMargin >= 0 ? 'success' : 'danger'}
              />
              <Field
                label="Margin %"
                value={formatPercent(pnl.marginPercent)}
                tone={pnl.marginPercent >= 15 ? 'success' : pnl.marginPercent < 8 ? 'danger' : undefined}
              />
            </dl>

            <div className="mt-5">
              <p className="mb-2 text-xs font-medium text-muted">Cost build-up</p>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-2">
                {costLines.map((line, index) => (
                  <div
                    key={line.label}
                    className={cn(
                      index === 0 && 'bg-primary',
                      index === 1 && 'bg-info',
                      index === 2 && 'bg-warning',
                      index === 3 && 'bg-muted',
                    )}
                    style={{ width: `${pnl.revenue > 0 ? (line.value / pnl.revenue) * 100 : 0}%` }}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {costLines.map((line) => (
                  <div key={line.label}>
                    <dt className="text-xs text-muted">{line.label}</dt>
                    <dd className="text-sm font-medium tabular-nums text-text">
                      {formatCurrency(line.value, 'USD', { compact: true })}
                      <span className="ml-1 text-xs font-normal text-muted">
                        {pnl.revenue > 0 ? formatPercent((line.value / pnl.revenue) * 100, 0) : '—'}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </>
        )}
      </Panel>

      <Panel
        title="Receivables"
        description={
          invoiced > 0
            ? `${formatCurrency(received, 'USD')} received of ${formatCurrency(invoiced, 'USD')} invoiced`
            : 'Nothing invoiced yet'
        }
        padded={invoices.length === 0}
      >
        {invoices.length === 0 ? (
          <TabEmpty
            icon={Banknote}
            title="No invoices raised"
            description="An advance invoice follows the PO; the commercial invoice follows the shipment."
          />
        ) : (
          <>
            <Progress
              value={invoiced > 0 ? (received / invoiced) * 100 : 0}
              tone={received >= invoiced ? 'success' : 'warning'}
              className="mb-4"
              showValue
              label="Collected"
            />
            <MiniTable
              head={[
                'Invoice',
                'Kind',
                { label: 'Amount', align: 'right' },
                { label: 'Received', align: 'right' },
                { label: 'Balance', align: 'right' },
                'Due',
                'Status',
              ]}
            >
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-border last:border-0">
                  <th scope="row" className="px-3 py-2 text-left font-medium text-text">
                    {invoice.number}
                  </th>
                  <td className="px-3 py-2 text-xs text-muted">{invoice.kind?.toLowerCase() ?? '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-text">
                    {formatCurrency(invoice.amount, 'USD')}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-text">
                    {formatCurrency(invoice.receivedAmount, 'USD')}
                  </td>
                  <td
                    className={cn(
                      'px-3 py-2 text-right tabular-nums',
                      invoice.balance > 0 ? 'font-medium text-danger' : 'text-muted',
                    )}
                  >
                    {formatCurrency(invoice.balance, 'USD')}
                  </td>
                  <td className="px-3 py-2 text-text">{formatDate(invoice.dueAt)}</td>
                  <td className="px-3 py-2">
                    <StatusBadge kind="invoice" value={invoice.status} size="sm" />
                  </td>
                </tr>
              ))}
            </MiniTable>
          </>
        )}
      </Panel>

      {bills.length > 0 && (
        <Panel title="Vendor cost" description="Bills raised against this order." padded={false}>
          <MiniTable
            head={['Bill', 'Vendor', { label: 'Amount', align: 'right' }, { label: 'Paid', align: 'right' }, 'Due', 'Status']}
          >
            {bills.map((bill) => (
              <tr key={bill.id} className="border-b border-border last:border-0">
                <th scope="row" className="px-3 py-2 text-left font-medium text-text">
                  {bill.number}
                </th>
                <td className="px-3 py-2 text-text">
                  {vendorsById?.[bill.vendorId]?.name ?? bill.vendorName}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-text">
                  {formatCurrency(bill.amount, 'USD')}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-text">
                  {formatCurrency(bill.paidAmount, 'USD')}
                </td>
                <td className="px-3 py-2 text-text">{formatDate(bill.dueAt)}</td>
                <td className="px-3 py-2">
                  <StatusBadge kind="invoice" value={bill.status} size="sm" />
                </td>
              </tr>
            ))}
          </MiniTable>
        </Panel>
      )}
    </div>
  )
}

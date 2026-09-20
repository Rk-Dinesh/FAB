import { useMemo } from 'react'
import { cn } from '@/utils/cn'
import { buildSizeMatrix } from '@/services/orderService'
import { formatNumber, formatPercent } from '@/utils/format'
import { MiniTable, Panel } from './TabShell'

/** Order 360 → Style & size matrix: the colour × size quantity grid. */
export function SizeMatrixTab({ order }) {
  const matrix = useMemo(() => buildSizeMatrix(order), [order])

  return (
    <div className="flex flex-col gap-4">
      <Panel
        title="Colour × size breakdown"
        description={`${matrix.rows.length} colours × ${matrix.sizes.length} sizes · ${formatNumber(matrix.grandTotal)} pcs`}
        padded={false}
      >
        <MiniTable
          head={[
            'Colour',
            ...matrix.sizes.map((size) => ({ label: size, align: 'right' })),
            { label: 'Total', align: 'right' },
            { label: 'Share', align: 'right' },
          ]}
        >
          {matrix.rows.map((row) => (
            <tr key={row.colorId} className="border-b border-border last:border-0">
              <th scope="row" className="px-3 py-2 text-left font-medium text-text">
                <span className="flex items-center gap-2">
                  <span
                    className="size-4 shrink-0 rounded border border-border-strong"
                    style={{ backgroundColor: row.color.hex ?? 'var(--surface-2)' }}
                    aria-hidden="true"
                  />
                  <span className="truncate">{row.color.name}</span>
                </span>
              </th>
              {matrix.sizes.map((size) => (
                <td key={size} className="px-3 py-2 text-right tabular-nums text-text">
                  {formatNumber(row.sizes[size] ?? 0)}
                </td>
              ))}
              <td className="px-3 py-2 text-right font-semibold tabular-nums text-text">
                {formatNumber(row.total)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-muted">
                {formatPercent((row.total / matrix.grandTotal) * 100, 1)}
              </td>
            </tr>
          ))}

          <tr className="bg-surface-2/60">
            <th scope="row" className="px-3 py-2.5 text-left text-sm font-semibold text-text">
              Total
            </th>
            {matrix.sizes.map((size) => (
              <td key={size} className="px-3 py-2.5 text-right font-semibold tabular-nums text-text">
                {formatNumber(matrix.columnTotals[size])}
              </td>
            ))}
            <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-text">
              {formatNumber(matrix.grandTotal)}
            </td>
            <td className="px-3 py-2.5 text-right tabular-nums text-muted">100%</td>
          </tr>
        </MiniTable>
      </Panel>

      <Panel title="Size curve" description="Share of the buy by size, across all colours.">
        <div className="flex items-end gap-2">
          {matrix.sizes.map((size) => {
            const share = (matrix.columnTotals[size] / matrix.grandTotal) * 100
            const max = Math.max(...matrix.sizes.map((entry) => matrix.columnTotals[entry]))
            const height = max > 0 ? (matrix.columnTotals[size] / max) * 100 : 0
            return (
              <div key={size} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <span className="text-xs font-medium tabular-nums text-text">
                  {formatPercent(share, 0)}
                </span>
                <div className="flex h-24 w-full items-end">
                  <div
                    className={cn(
                      'w-full rounded-t-sm bg-primary transition-all',
                      height < 12 && 'min-h-1',
                    )}
                    style={{ height: `${height}%` }}
                    aria-hidden="true"
                  />
                </div>
                <span className="truncate text-xs text-muted">{size}</span>
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}

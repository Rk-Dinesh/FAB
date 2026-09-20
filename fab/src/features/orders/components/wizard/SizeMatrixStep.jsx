import { Plus, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button, Select } from '@/components/ui'
import { formatNumber } from '@/utils/format'

/**
 * Step 2 — build the colour × size quantity grid. Totals recalculate live so
 * the merchandiser can see the buy take shape.
 *
 * @param {{value: {colorIds: string[], sizeSetId: string, grid: Record<string, Record<string, number>>},
 *   onChange: (next: object) => void, colors: Array<object>, sizeSets: Array<object>,
 *   error?: string}} props
 */
export function SizeMatrixStep({ value, onChange, colors, sizeSets, error }) {
  const sizeSet = sizeSets.find((entry) => entry.id === value.sizeSetId)
  const sizes = sizeSet?.sizes ?? []
  const colorById = Object.fromEntries(colors.map((color) => [color.id, color]))

  const setCell = (colorId, size, quantity) => {
    const next = { ...value.grid, [colorId]: { ...(value.grid[colorId] ?? {}), [size]: quantity } }
    onChange({ ...value, grid: next })
  }

  const addColor = (colorId) => {
    if (!colorId || value.colorIds.includes(colorId)) return
    onChange({
      ...value,
      colorIds: [...value.colorIds, colorId],
      grid: { ...value.grid, [colorId]: Object.fromEntries(sizes.map((size) => [size, 0])) },
    })
  }

  const removeColor = (colorId) => {
    const grid = { ...value.grid }
    delete grid[colorId]
    onChange({ ...value, colorIds: value.colorIds.filter((entry) => entry !== colorId), grid })
  }

  const changeSizeSet = (sizeSetId) => {
    const nextSizes = sizeSets.find((entry) => entry.id === sizeSetId)?.sizes ?? []
    // Keep any quantity whose size still exists in the new run.
    const grid = Object.fromEntries(
      value.colorIds.map((colorId) => [
        colorId,
        Object.fromEntries(nextSizes.map((size) => [size, value.grid[colorId]?.[size] ?? 0])),
      ]),
    )
    onChange({ ...value, sizeSetId, grid })
  }

  const columnTotal = (size) =>
    value.colorIds.reduce((sum, colorId) => sum + (value.grid[colorId]?.[size] ?? 0), 0)
  const rowTotal = (colorId) =>
    sizes.reduce((sum, size) => sum + (value.grid[colorId]?.[size] ?? 0), 0)
  const grandTotal = value.colorIds.reduce((sum, colorId) => sum + rowTotal(colorId), 0)

  const available = colors.filter((color) => !value.colorIds.includes(color.id))

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Size set"
          value={value.sizeSetId}
          onChange={(event) => changeSizeSet(event.target.value)}
          options={sizeSets.map((entry) => ({
            value: entry.id,
            label: `${entry.name} (${entry.sizes.join(', ')})`,
          }))}
          required
        />
        <div className="flex items-end gap-2">
          <Select
            label="Add a colour"
            value=""
            onChange={(event) => addColor(event.target.value)}
            placeholder={available.length > 0 ? 'Pick a colour…' : 'All colours added'}
            options={available.map((color) => ({ value: color.id, label: color.name }))}
            containerClassName="flex-1"
          />
        </div>
      </div>

      {value.colorIds.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
          <p className="text-sm font-medium text-text">No colours yet</p>
          <p className="mt-1 text-sm text-muted">
            Add at least one colour to start entering quantities.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-surface-2/50">
              <tr>
                <th scope="col" className="border-b border-border px-3 py-2 text-left text-xs font-semibold text-muted">
                  Colour
                </th>
                {sizes.map((size) => (
                  <th
                    key={size}
                    scope="col"
                    className="w-20 border-b border-border px-2 py-2 text-center text-xs font-semibold text-muted"
                  >
                    {size}
                  </th>
                ))}
                <th scope="col" className="border-b border-border px-3 py-2 text-right text-xs font-semibold text-muted">
                  Total
                </th>
                <th scope="col" className="w-10 border-b border-border" />
              </tr>
            </thead>
            <tbody>
              {value.colorIds.map((colorId) => (
                <tr key={colorId} className="border-b border-border last:border-0">
                  <th scope="row" className="px-3 py-2 text-left font-medium text-text">
                    <span className="flex items-center gap-2">
                      <span
                        className="size-4 shrink-0 rounded border border-border-strong"
                        style={{ backgroundColor: colorById[colorId]?.hex ?? 'var(--surface-2)' }}
                        aria-hidden="true"
                      />
                      {colorById[colorId]?.name ?? colorId}
                    </span>
                  </th>
                  {sizes.map((size) => (
                    <td key={size} className="px-1.5 py-1.5">
                      <input
                        type="number"
                        min="0"
                        step="12"
                        value={value.grid[colorId]?.[size] ?? 0}
                        onChange={(event) => setCell(colorId, size, Number(event.target.value) || 0)}
                        aria-label={`${colorById[colorId]?.name ?? colorId} size ${size}`}
                        className={cn(
                          'h-8 w-full rounded-md border border-border bg-surface px-1.5 text-center text-sm',
                          'tabular-nums text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25',
                        )}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right font-semibold tabular-nums text-text">
                    {formatNumber(rowTotal(colorId))}
                  </td>
                  <td className="px-1 py-2 text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeColor(colorId)}
                      aria-label={`Remove ${colorById[colorId]?.name ?? colorId}`}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}

              <tr className="bg-surface-2/60">
                <th scope="row" className="px-3 py-2.5 text-left text-sm font-semibold text-text">
                  Total
                </th>
                {sizes.map((size) => (
                  <td key={size} className="px-2 py-2.5 text-center font-semibold tabular-nums text-text">
                    {formatNumber(columnTotal(size))}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-primary">
                  {formatNumber(grandTotal)}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      {available.length > 0 && value.colorIds.length > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <Plus className="size-3" aria-hidden="true" />
          {available.length} more colours available from the colour master.
        </p>
      )}
    </div>
  )
}

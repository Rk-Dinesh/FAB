import { useMemo, useState } from 'react'
import { Calculator } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button, Drawer, Input, Select } from '@/components/ui'
import { calculateFob, marginFromPrice } from '@/services/costingService'
import { formatCurrency } from '@/utils/format'

const LINES = [
  { key: 'fabric', label: 'Fabric', hint: 'Consumption × rate' },
  { key: 'trims', label: 'Trims & packaging' },
  { key: 'cm', label: 'CM (cut & make)' },
  { key: 'wash', label: 'Wash / embellishment' },
  { key: 'overhead', label: 'Overhead' },
  { key: 'freight', label: 'Freight & handling' },
]

/**
 * The FOB build-up, recalculated on every keystroke. Margin and price stay in
 * sync in both directions: edit the margin and the price follows, edit the
 * price and the margin follows.
 *
 * @param {{open: boolean, onClose: () => void, sheet: object|null,
 *   onSave: (values: object) => Promise<void>, readOnly?: boolean}} props
 */
export function CostSheetEditor({ open, onClose, sheet, onSave, readOnly = false }) {
  const [lines, setLines] = useState(() => sheet?.lines ?? emptyLines())
  const [marginPercent, setMarginPercent] = useState(sheet?.marginPercent ?? 18)
  const [quantity, setQuantity] = useState(sheet?.quantity ?? 10000)
  const [status, setStatus] = useState(sheet?.status ?? 'DRAFT')
  const [saving, setSaving] = useState(false)
  const [key, setKey] = useState(sheet?.id ?? 'new')

  // Re-seed when a different sheet is opened, without an effect.
  if (open && (sheet?.id ?? 'new') !== key) {
    setKey(sheet?.id ?? 'new')
    setLines(sheet?.lines ?? emptyLines())
    setMarginPercent(sheet?.marginPercent ?? 18)
    setQuantity(sheet?.quantity ?? 10000)
    setStatus(sheet?.status ?? 'DRAFT')
  }

  const result = useMemo(() => calculateFob(lines, marginPercent), [lines, marginPercent])

  const setLine = (lineKey, value) =>
    setLines((current) => ({ ...current, [lineKey]: Number(value) || 0 }))

  /** Typing a target price back-solves the margin. */
  const setPrice = (value) => {
    const price = Number(value) || 0
    setMarginPercent(price > 0 ? marginFromPrice(result.subtotal, price) : 0)
  }

  const save = async () => {
    setSaving(true)
    try {
      await onSave({
        lines,
        marginPercent,
        quantity,
        status,
        subtotal: result.subtotal,
        fobPrice: result.fobPrice,
        totalValue: Number((result.fobPrice * quantity).toFixed(2)),
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={sheet ? `Cost sheet ${sheet.reference}` : 'New cost sheet'}
      description={sheet ? `${sheet.styleName} · ${sheet.clientName}` : 'Build the FOB price up from its parts.'}
      size="lg"
      footer={
        !readOnly && (
          <>
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              Save cost sheet
            </Button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            label="Order quantity (pcs)"
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value) || 0)}
            disabled={readOnly}
          />
          <Select
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            disabled={readOnly}
            options={[
              { value: 'DRAFT', label: 'Draft' },
              { value: 'SENT', label: 'Sent to client' },
              { value: 'APPROVED', label: 'Approved' },
            ]}
          />
        </div>

        <section className="rounded-lg border border-border">
          <header className="flex items-center gap-2 border-b border-border bg-surface-2/40 px-3 py-2">
            <Calculator className="size-4 text-muted" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-text">Per-piece build-up</h3>
            <span className="ml-auto text-xs text-muted">USD / pc</span>
          </header>

          <div className="flex flex-col divide-y divide-border">
            {LINES.map((line) => (
              <label
                key={line.key}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-2/30"
              >
                <span className="flex-1">
                  <span className="text-sm text-text">{line.label}</span>
                  {line.hint && <span className="block text-xs text-muted">{line.hint}</span>}
                </span>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={lines[line.key] ?? 0}
                  onChange={(event) => setLine(line.key, event.target.value)}
                  disabled={readOnly}
                  aria-label={line.label}
                  className={cn(
                    'h-8 w-28 rounded-lg border border-border bg-surface px-2 text-right text-sm',
                    'tabular-nums text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25',
                    'disabled:bg-surface-2 disabled:opacity-60',
                  )}
                />
              </label>
            ))}

            <div className="flex items-center gap-3 bg-surface-2/50 px-3 py-2.5">
              <span className="flex-1 text-sm font-semibold text-text">Cost subtotal</span>
              <span className="w-28 text-right text-sm font-semibold tabular-nums text-text">
                {result.subtotal.toFixed(3)}
              </span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            step="0.1"
            label="Margin %"
            value={marginPercent}
            onChange={(event) => setMarginPercent(Number(event.target.value) || 0)}
            hint={`Margin value ${formatCurrency(result.marginValue, 'USD', { decimals: 3 })}/pc`}
            disabled={readOnly}
          />
          <Input
            type="number"
            step="0.01"
            label="FOB price"
            value={result.fobPrice}
            onChange={(event) => setPrice(event.target.value)}
            hint="Edit either side — the other follows"
            disabled={readOnly}
          />
        </section>

        <dl className="grid grid-cols-3 gap-3 rounded-lg border border-primary/25 bg-primary-soft p-4">
          <Summary label="FOB / pc" value={formatCurrency(result.fobPrice, 'USD', { decimals: 2 })} />
          <Summary label="Margin" value={`${marginPercent.toFixed(1)}%`} />
          <Summary
            label="Order value"
            value={formatCurrency(result.fobPrice * quantity, 'USD', { compact: true })}
          />
        </dl>
      </div>
    </Drawer>
  )
}

function Summary({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-primary/80">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold tabular-nums text-primary">{value}</dd>
    </div>
  )
}

function emptyLines() {
  return { fabric: 0, trims: 0, cm: 0, wash: 0, overhead: 0, freight: 0 }
}

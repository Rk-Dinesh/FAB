import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'

// Read once at module load: render must stay pure, and a wizard session lasts
// minutes, so a fixed "today" is accurate enough for the lead-time check.
const TODAY_MS = Date.now()

/**
 * Step 5 — everything the wizard collected, plus a sanity check on the margin
 * and the lead time before the order is created.
 *
 * @param {{form: object, client: object|undefined, quantity: number,
 *   pricing: {subtotal: number, fobPrice: number}, lookups: object}} props
 */
export function ReviewStep({ form, client, quantity, pricing, lookups }) {
  const nameOf = (collection, id) => lookups[collection]?.find((entry) => entry.id === id)?.name ?? '—'
  const leadDays = Math.round(
    (new Date(`${form.exFactoryDate}T00:00:00.000Z`).getTime() - TODAY_MS) / 86400000,
  )

  const warnings = [
    form.marginPercent < 12 && `Margin of ${form.marginPercent}% is below the usual 12% floor.`,
    leadDays < 60 && `Only ${leadDays} days to ex-factory — the standard T&A needs about 76.`,
    !form.factoryVendorId && 'No factory allocated yet; production planning will need one.',
    quantity < 500 && 'Quantity is very low for a bulk order — check it is not a sampling run.',
  ].filter(Boolean)

  return (
    <div className="flex flex-col gap-5">
      <Section title="Client & style">
        <Row label="Client" value={client?.name} />
        <Row label="Client PO" value={form.clientPoNumber || '—'} />
        <Row label="Style" value={`${form.styleName} (${form.styleNumber})`} />
        <Row label="Category" value={nameOf('categories', form.categoryId)} />
        <Row label="Fabric" value={nameOf('fabrics', form.fabricId)} />
        <Row label="Merchandiser" value={nameOf('employees', form.merchandiserId)} />
        <Row label="Season" value={form.season} />
      </Section>

      <Section title="Quantity">
        <Row label="Size set" value={nameOf('sizeSets', form.matrix.sizeSetId)} />
        <Row label="Colours" value={`${form.matrix.colorIds.length} colours`} />
        <Row label="Total quantity" value={`${formatNumber(quantity)} pcs`} />
        <Row
          label="Breakdown"
          value={form.matrix.colorIds
            .map((colorId) => {
              const total = Object.values(form.matrix.grid[colorId] ?? {}).reduce(
                (sum, value) => sum + value,
                0,
              )
              return `${nameOf('colors', colorId)} ${formatNumber(total)}`
            })
            .join(' · ')}
        />
      </Section>

      <Section title="Dates">
        <Row label="PO confirmed" value={formatDate(form.confirmedDate)} />
        <Row label="Ex-factory" value={formatDate(form.exFactoryDate)} />
        <Row label="Delivery" value={formatDate(form.deliveryDate)} />
        <Row label="Lead time" value={`${leadDays} days from today`} />
        <Row label="Factory" value={form.factoryVendorId ? nameOf('vendors', form.factoryVendorId) : 'Not allocated'} />
        <Row
          label="Route"
          value={[form.hasDesign && 'design stage', form.hasWash && 'wash / embellishment']
            .filter(Boolean)
            .join(', ') || 'straight to bulk'}
        />
      </Section>

      <Section title="Pricing">
        <Row label="Cost / pc" value={formatCurrency(pricing.subtotal, 'USD', { decimals: 3 })} />
        <Row label="Margin" value={`${form.marginPercent}%`} />
        <Row label="FOB / pc" value={formatCurrency(pricing.fobPrice, 'USD', { decimals: 2 })} />
        <Row label="Order value" value={formatCurrency(pricing.fobPrice * quantity, 'USD')} />
        <Row label="Terms" value={`${form.incoterm} · ${form.paymentTermCode}`} />
      </Section>

      <div
        className={
          warnings.length === 0
            ? 'rounded-lg border border-success/30 bg-success-soft p-4'
            : 'rounded-lg border border-warning/30 bg-warning-soft p-4'
        }
      >
        {warnings.length === 0 ? (
          <p className="flex items-center gap-2 text-sm font-medium text-success">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Everything checks out. The order will be created as confirmed.
          </p>
        ) : (
          <>
            <p className="flex items-center gap-2 text-sm font-medium text-warning">
              <AlertTriangle className="size-4" aria-hidden="true" />
              {warnings.length} thing{warnings.length === 1 ? '' : 's'} worth a second look
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {warnings.map((warning) => (
                <li key={warning} className="text-sm text-warning/90">
                  · {warning}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-warning/80">
              These are advisory — you can still create the order.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        <Badge size="sm" tone="outline">
          review
        </Badge>
      </div>
      <dl className="divide-y divide-border rounded-lg border border-border">{children}</dl>
    </section>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-right text-sm text-text">{value || '—'}</dd>
    </div>
  )
}

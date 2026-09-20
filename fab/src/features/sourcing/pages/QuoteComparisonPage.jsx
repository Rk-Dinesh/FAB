import { useCallback, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Award, Check, Clock, GitCompare, Trophy } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Badge, Button, Card, CardBody, EmptyState, Select, Spinner } from '@/components/ui'
import { PageHeader } from '@/components/shared'
import { useAsync } from '@/hooks'
import { useCan } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { awardRfq, getQuoteComparison, rfqService } from '@/services/sourcingService'
import { recordAudit } from '@/services/adminService'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'

/** Sourcing → Quote comparison: vendor quotes side by side, best price marked. */
export function QuoteComparisonPage() {
  const can = useCan()
  const [searchParams, setSearchParams] = useSearchParams()
  const rfqId = searchParams.get('rfq')
  const [awarding, setAwarding] = useState(null)

  const listLoad = useCallback(() => rfqService.list(), [])
  const { data: rfqs } = useAsync(listLoad)

  const load = useCallback(
    () => (rfqId ? getQuoteComparison(rfqId) : Promise.resolve(null)),
    [rfqId],
  )
  const { data, loading, reload } = useAsync(load, [rfqId], { enabled: Boolean(rfqId) })

  const award = async (quote) => {
    setAwarding(quote.id)
    try {
      await awardRfq(rfqId, quote.id)
      void recordAudit({
        action: 'RFQ_AWARDED',
        module: 'sourcing',
        entity: data.rfq.reference,
        description: `Awarded ${data.rfq.reference} to ${quote.vendor?.name} at ${quote.rate} ${quote.currency}/${quote.uom}`,
      })
      toast.success('RFQ awarded', `${quote.vendor?.name} · ${formatCurrency(quote.rate, 'USD', { decimals: 3 })}/${quote.uom}`)
      reload()
    } finally {
      setAwarding(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Quote comparison"
        description="Vendor quotes against one RFQ, with the best price and the shortest lead time marked."
        breadcrumbs={[{ label: 'Sourcing', to: '/app/sourcing/rfq' }, { label: 'Quote comparison' }]}
        actions={
          <Select
            value={rfqId ?? ''}
            onChange={(event) => setSearchParams(event.target.value ? { rfq: event.target.value } : {})}
            placeholder="Choose an RFQ…"
            containerClassName="w-72"
            aria-label="Select an RFQ"
            options={(rfqs ?? []).map((rfq) => ({
              value: rfq.id,
              label: `${rfq.reference} — ${rfq.materialName} (${rfq.poNumber})`,
            }))}
          />
        }
      />

      {!rfqId ? (
        <Card>
          <EmptyState
            icon={GitCompare}
            title="Pick an RFQ to compare"
            description="Choose a request above to see every vendor quote side by side."
          />
        </Card>
      ) : loading || !data ? (
        <Card>
          <CardBody className="flex items-center justify-center gap-3 py-16 text-sm text-muted">
            <Spinner /> Loading quotes…
          </CardBody>
        </Card>
      ) : (
        <>
          <Card className="mb-5">
            <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Field label="RFQ" value={data.rfq.reference} />
              <Field
                label="Order"
                value={
                  <Link to={`/app/orders/${data.rfq.orderId}`} className="text-primary hover:underline">
                    {data.rfq.poNumber}
                  </Link>
                }
                hint={data.rfq.clientName}
              />
              <Field label="Material" value={data.rfq.materialName} />
              <Field
                label="Quantity"
                value={`${formatNumber(data.rfq.quantity)} ${data.rfq.uom}`}
              />
              <Field label="Required by" value={formatDate(data.rfq.requiredBy)} />
            </CardBody>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.quotes.map((quote) => (
              <article
                key={quote.id}
                className={cn(
                  'flex flex-col rounded-lg border bg-surface p-4',
                  quote.selected
                    ? 'border-success ring-1 ring-success/30'
                    : quote.isBestPrice
                      ? 'border-primary'
                      : 'border-border',
                )}
              >
                <header className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-text">
                      {quote.vendor?.name ?? quote.vendorId}
                    </h3>
                    <p className="truncate text-xs text-muted">
                      {quote.vendor?.city} · rating {quote.vendor?.rating}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {quote.selected && (
                      <Badge tone="success" size="sm" icon={<Check className="size-3" />}>
                        Awarded
                      </Badge>
                    )}
                    {quote.isBestPrice && !quote.selected && (
                      <Badge tone="primary" size="sm" icon={<Trophy className="size-3" />}>
                        Best price
                      </Badge>
                    )}
                    {quote.isFastest && (
                      <Badge tone="info" size="sm" icon={<Clock className="size-3" />}>
                        Fastest
                      </Badge>
                    )}
                  </div>
                </header>

                <dl className="mt-4 flex flex-col gap-2.5">
                  <Line
                    label={`Rate / ${quote.uom}`}
                    value={formatCurrency(quote.rate, 'USD', { decimals: 3 })}
                    emphasis
                    tone={quote.isBestPrice ? 'success' : undefined}
                  />
                  <Line
                    label="Total value"
                    value={formatCurrency(quote.totalValue, 'USD')}
                  />
                  <Line
                    label="vs best price"
                    value={quote.priceDeltaPercent === 0 ? '—' : `+${quote.priceDeltaPercent}%`}
                    tone={quote.priceDeltaPercent > 5 ? 'danger' : undefined}
                  />
                  <Line label="Lead time" value={`${quote.leadTimeDays} days`} />
                  <Line label="Payment terms" value={quote.paymentTermCode} />
                  <Line label="Valid until" value={formatDate(quote.validUntil)} />
                </dl>

                <p className="mt-3 flex-1 text-xs leading-relaxed text-muted">{quote.remarks}</p>

                {can('sourcing', 'approve') && (
                  <Button
                    className="mt-4 w-full"
                    variant={quote.selected ? 'secondary' : quote.isBestPrice ? 'primary' : 'secondary'}
                    size="sm"
                    disabled={quote.selected}
                    loading={awarding === quote.id}
                    onClick={() => award(quote)}
                  >
                    <Award className="size-4" />
                    {quote.selected ? 'Awarded' : 'Award this quote'}
                  </Button>
                )}
              </article>
            ))}
          </div>

          {data.quotes.length === 0 && (
            <Card>
              <EmptyState
                title="No quotes received yet"
                description="Vendors have been invited but none have responded."
              />
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function Field({ label, value, hint }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-text">{value}</p>
      {hint && <p className="truncate text-[11px] text-muted">{hint}</p>}
    </div>
  )
}

function Line({ label, value, emphasis, tone }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd
        className={cn(
          'tabular-nums',
          emphasis ? 'text-base font-semibold' : 'text-sm',
          tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-text',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

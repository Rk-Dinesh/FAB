import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { Button, Card, CardBody, Input, PageSpinner, Select, Stepper, Textarea } from '@/components/ui'
import { PageHeader } from '@/components/shared'
import { useAsync } from '@/hooks'
import { toast } from '@/store/toastStore'
import { orderService } from '@/services/orderService'
import { clientService } from '@/services/crmService'
import { recordAudit } from '@/services/adminService'
import { calculateFob } from '@/services/costingService'
import { table } from '@/mocks/db'
import { formatCurrency, formatNumber } from '@/utils/format'
import { SizeMatrixStep } from '../components/wizard/SizeMatrixStep'
import { ReviewStep } from '../components/wizard/ReviewStep'

const STEPS = [
  { value: 'client', label: 'Client & style' },
  { value: 'matrix', label: 'Size matrix' },
  { value: 'dates', label: 'Dates & T&A' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'review', label: 'Review' },
]

/** @param {number} days */
function inDays(days) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
}

/** Orders → new: a five-step wizard that ends in a real order record. */
export function OrderNewPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const clients = await clientService.list()
    return {
      clients,
      categories: table('categories'),
      fabrics: table('fabrics'),
      colors: table('colors'),
      sizeSets: table('sizeSets'),
      vendors: table('vendors').filter((vendor) => vendor.type === 'FACTORY'),
      employees: table('employees').filter((employee) => employee.department === 'Merchandising'),
    }
  }, [])
  const { data, loading } = useAsync(load)

  const [form, setForm] = useState(() => ({
    clientId: '',
    clientPoNumber: '',
    styleName: '',
    styleNumber: '',
    categoryId: 'CAT-001',
    fabricId: 'FAB-001',
    season: 'SS27',
    hasDesign: true,
    hasWash: false,
    merchandiserId: '',
    factoryVendorId: '',
    matrix: { colorIds: [], sizeSetId: 'SZS-001', grid: {} },
    exFactoryDate: inDays(90),
    deliveryDate: inDays(118),
    confirmedDate: inDays(0),
    incoterm: 'FOB',
    paymentTermCode: 'TT 45',
    lines: { fabric: 2.2, trims: 0.65, cm: 1.4, wash: 0, overhead: 0.35, freight: 0.12 },
    marginPercent: 18,
    notes: '',
  }))

  const set = (patch) => setForm((current) => ({ ...current, ...patch }))

  const quantity = useMemo(
    () =>
      form.matrix.colorIds.reduce(
        (sum, colorId) =>
          sum + Object.values(form.matrix.grid[colorId] ?? {}).reduce((rowSum, value) => rowSum + value, 0),
        0,
      ),
    [form.matrix],
  )

  const pricing = useMemo(
    () => calculateFob(form.lines, form.marginPercent),
    [form.lines, form.marginPercent],
  )

  const client = data?.clients.find((entry) => entry.id === form.clientId)

  /** @returns {Record<string,string>} */
  const validate = (index) => {
    const found = {}
    if (index === 0) {
      if (!form.clientId) found.clientId = 'Pick the client this order is for'
      if (!form.styleName.trim()) found.styleName = 'Give the style a name'
      if (!form.styleNumber.trim()) found.styleNumber = 'A style reference is required'
      if (!form.merchandiserId) found.merchandiserId = 'Assign a merchandiser'
    }
    if (index === 1) {
      if (form.matrix.colorIds.length === 0) found.matrix = 'Add at least one colour'
      else if (quantity <= 0) found.matrix = 'Enter quantities for at least one size'
    }
    if (index === 2) {
      if (!form.exFactoryDate) found.exFactoryDate = 'An ex-factory date is required'
      if (form.deliveryDate && form.deliveryDate < form.exFactoryDate) {
        found.deliveryDate = 'Delivery cannot be before the ex-factory date'
      }
    }
    if (index === 3) {
      if (pricing.fobPrice <= 0) found.pricing = 'The FOB price must be above zero'
      if (form.marginPercent < 0 || form.marginPercent >= 100) {
        found.marginPercent = 'Margin must be between 0 and 99%'
      }
    }
    return found
  }

  const next = () => {
    const found = validate(step)
    setErrors(found)
    if (Object.keys(found).length === 0) setStep((current) => Math.min(STEPS.length - 1, current + 1))
  }

  const back = () => {
    setErrors({})
    setStep((current) => Math.max(0, current - 1))
  }

  const submit = async () => {
    const allErrors = [0, 1, 2, 3].reduce((acc, index) => ({ ...acc, ...validate(index) }), {})
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      toast.error('Some details are missing', 'Check the earlier steps before creating the order.')
      return
    }

    setSaving(true)
    try {
      const sizes = data.sizeSets.find((entry) => entry.id === form.matrix.sizeSetId)?.sizes ?? []
      const sizeMatrix = form.matrix.colorIds.map((colorId) => {
        const row = Object.fromEntries(sizes.map((size) => [size, form.matrix.grid[colorId]?.[size] ?? 0]))
        return {
          colorId,
          sizes: row,
          total: Object.values(row).reduce((sum, value) => sum + value, 0),
        }
      })

      const poNumber = `PO-${1001 + table('orders').length}`
      const created = await orderService.create({
        poNumber,
        clientPoNumber: form.clientPoNumber || `${client.code}-NEW`,
        clientId: form.clientId,
        clientName: client.name,
        styleNumber: form.styleNumber,
        styleName: form.styleName,
        categoryId: form.categoryId,
        fabricId: form.fabricId,
        sizeSetId: form.matrix.sizeSetId,
        colorIds: form.matrix.colorIds,
        sizeMatrix,
        quantity,
        unit: 'PCS',
        fobPrice: pricing.fobPrice,
        currency: 'USD',
        orderValue: Number((pricing.fobPrice * quantity).toFixed(2)),
        status: 'CONFIRMED',
        statusIndex: 5,
        risk: 'ON_TRACK',
        hasDesign: form.hasDesign,
        hasWash: form.hasWash,
        incoterm: form.incoterm,
        paymentTermCode: form.paymentTermCode,
        destinationPortId: client.destinationPortId,
        merchandiserId: form.merchandiserId,
        factoryVendorId: form.factoryVendorId || null,
        enquiryDate: inDays(-14),
        confirmedDate: form.confirmedDate,
        exFactoryDate: form.exFactoryDate,
        revisedExFactoryDate: null,
        shipDate: null,
        deliveryDate: form.deliveryDate,
        delayDays: 0,
        milestones: buildMilestones(form.exFactoryDate),
        season: form.season,
        notes: form.notes,
      })

      void recordAudit({
        action: 'ORDER_CREATED',
        module: 'orders',
        entity: created.poNumber,
        description: `Created ${created.poNumber} for ${client.name} — ${formatNumber(quantity)} pcs`,
      })
      toast.success('Order created', `${created.poNumber} · ${client.name}`)
      navigate(`/app/orders/${created.id}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !data) return <PageSpinner label="Loading reference data" />

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="New order"
        description="Five steps from client brief to a live order record."
        breadcrumbs={[{ label: 'Orders', to: '/app/orders' }, { label: 'New order' }]}
      />

      <Stepper steps={STEPS} current={step} onStepClick={setStep} className="mb-6" />

      <Card>
        <CardBody>
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Client"
                required
                value={form.clientId}
                onChange={(event) => set({ clientId: event.target.value })}
                placeholder="Select a client…"
                error={errors.clientId}
                options={data.clients.map((entry) => ({ value: entry.id, label: entry.name }))}
              />
              <Input
                label="Client PO number"
                value={form.clientPoNumber}
                onChange={(event) => set({ clientPoNumber: event.target.value })}
                placeholder="NWA-2650"
              />
              <Input
                label="Style name"
                required
                value={form.styleName}
                onChange={(event) => set({ styleName: event.target.value })}
                placeholder="Heavyweight pocket tee"
                error={errors.styleName}
              />
              <Input
                label="Style number"
                required
                value={form.styleNumber}
                onChange={(event) => set({ styleNumber: event.target.value })}
                placeholder="NWA-2431"
                error={errors.styleNumber}
              />
              <Select
                label="Category"
                value={form.categoryId}
                onChange={(event) => set({ categoryId: event.target.value })}
                options={data.categories.map((entry) => ({ value: entry.id, label: entry.name }))}
              />
              <Select
                label="Fabric"
                value={form.fabricId}
                onChange={(event) => set({ fabricId: event.target.value })}
                options={data.fabrics.map((entry) => ({ value: entry.id, label: entry.name }))}
              />
              <Select
                label="Merchandiser"
                required
                value={form.merchandiserId}
                onChange={(event) => set({ merchandiserId: event.target.value })}
                placeholder="Assign an owner…"
                error={errors.merchandiserId}
                options={data.employees.map((entry) => ({ value: entry.id, label: entry.name }))}
              />
              <Select
                label="Season"
                value={form.season}
                onChange={(event) => set({ season: event.target.value })}
                options={['SS26', 'AW26', 'SS27', 'AW27'].map((value) => ({ value, label: value }))}
              />
            </div>
          )}

          {step === 1 && (
            <SizeMatrixStep
              value={form.matrix}
              onChange={(matrix) => set({ matrix })}
              colors={data.colors}
              sizeSets={data.sizeSets}
              error={errors.matrix}
            />
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                type="date"
                label="PO confirmed"
                value={form.confirmedDate}
                onChange={(event) => set({ confirmedDate: event.target.value })}
              />
              <Input
                type="date"
                label="Ex-factory date"
                required
                value={form.exFactoryDate}
                onChange={(event) => set({ exFactoryDate: event.target.value })}
                error={errors.exFactoryDate}
              />
              <Input
                type="date"
                label="Delivery at destination"
                value={form.deliveryDate}
                onChange={(event) => set({ deliveryDate: event.target.value })}
                error={errors.deliveryDate}
              />
              <Select
                label="Allocated factory"
                value={form.factoryVendorId}
                onChange={(event) => set({ factoryVendorId: event.target.value })}
                placeholder="Allocate later…"
                options={data.vendors.map((entry) => ({ value: entry.id, label: entry.name }))}
              />
              <div className="sm:col-span-2">
                <p className="mb-2 text-sm font-medium text-text">Route options</p>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm text-muted">
                    <input
                      type="checkbox"
                      checked={form.hasDesign}
                      onChange={(event) => set({ hasDesign: event.target.checked })}
                      className="size-4 rounded border-border-strong"
                    />
                    Includes a design stage
                  </label>
                  <label className="flex items-center gap-2 text-sm text-muted">
                    <input
                      type="checkbox"
                      checked={form.hasWash}
                      onChange={(event) => set({ hasWash: event.target.checked })}
                      className="size-4 rounded border-border-strong"
                    />
                    Needs washing or embellishment
                  </label>
                </div>
              </div>
              <p className="text-xs text-muted sm:col-span-2">
                A 14-milestone T&A calendar is generated back from the ex-factory date, and appears
                on the order’s T&A tab.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ['fabric', 'Fabric'],
                  ['trims', 'Trims'],
                  ['cm', 'CM'],
                  ['wash', 'Wash'],
                  ['overhead', 'Overhead'],
                  ['freight', 'Freight'],
                ].map(([key, label]) => (
                  <Input
                    key={key}
                    type="number"
                    step="0.001"
                    label={`${label} / pc`}
                    value={form.lines[key]}
                    onChange={(event) =>
                      set({ lines: { ...form.lines, [key]: Number(event.target.value) || 0 } })
                    }
                  />
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  type="number"
                  step="0.1"
                  label="Margin %"
                  value={form.marginPercent}
                  onChange={(event) => set({ marginPercent: Number(event.target.value) || 0 })}
                  error={errors.marginPercent}
                />
                <Select
                  label="Incoterm"
                  value={form.incoterm}
                  onChange={(event) => set({ incoterm: event.target.value })}
                  options={['FOB', 'CIF', 'CFR', 'DDP', 'DAP'].map((value) => ({ value, label: value }))}
                />
                <Select
                  label="Payment terms"
                  value={form.paymentTermCode}
                  onChange={(event) => set({ paymentTermCode: event.target.value })}
                  options={['TT 30', 'TT 45', 'TT 60', 'LC 60', 'LC 90', '30/70'].map((value) => ({
                    value,
                    label: value,
                  }))}
                />
              </div>

              <dl className="grid grid-cols-3 gap-3 rounded-lg border border-primary/25 bg-primary-soft p-4">
                <div>
                  <dt className="text-xs text-primary/80">Cost / pc</dt>
                  <dd className="mt-0.5 text-lg font-semibold tabular-nums text-primary">
                    {formatCurrency(pricing.subtotal, 'USD', { decimals: 3 })}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-primary/80">FOB / pc</dt>
                  <dd className="mt-0.5 text-lg font-semibold tabular-nums text-primary">
                    {formatCurrency(pricing.fobPrice, 'USD', { decimals: 2 })}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-primary/80">Order value</dt>
                  <dd className="mt-0.5 text-lg font-semibold tabular-nums text-primary">
                    {formatCurrency(pricing.fobPrice * quantity, 'USD', { compact: true })}
                  </dd>
                </div>
              </dl>
              {errors.pricing && <p className="text-sm text-danger">{errors.pricing}</p>}

              <Textarea
                label="Internal notes"
                value={form.notes}
                onChange={(event) => set({ notes: event.target.value })}
                placeholder="Anything the team should know before production starts."
              />
            </div>
          )}

          {step === 4 && (
            <ReviewStep
              form={form}
              client={client}
              quantity={quantity}
              pricing={pricing}
              lookups={data}
            />
          )}
        </CardBody>
      </Card>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button variant="secondary" onClick={back} disabled={step === 0 || saving}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next}>
            Continue <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button onClick={submit} loading={saving}>
            <Check className="size-4" /> Create order
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Generate the standard 14-milestone T&A calendar back from the ex-factory date.
 * @param {string} exFactoryDate YYYY-MM-DD
 */
function buildMilestones(exFactoryDate) {
  const anchor = new Date(`${exFactoryDate}T00:00:00.000Z`).getTime()
  const plan = [
    ['PO received', 'Merchandising', -76],
    ['Tech pack released', 'Design', -70],
    ['Lab dip approved', 'Design', -63],
    ['PP sample approved', 'Design', -52],
    ['Fabric PO placed', 'Sourcing', -58],
    ['Trims PO placed', 'Sourcing', -54],
    ['Fabric in-house', 'Sourcing', -34],
    ['Trims in-house', 'Sourcing', -30],
    ['Cutting start', 'Production', -28],
    ['Sewing start', 'Production', -24],
    ['Sewing end', 'Production', -10],
    ['Finishing complete', 'Production', -6],
    ['Final inspection', 'Quality', -3],
    ['Ex-factory', 'Logistics', 0],
  ]
  return plan.map(([name, owner, offset]) => ({
    name,
    owner,
    plannedDate: new Date(anchor + offset * 86400000).toISOString().slice(0, 10),
    actualDate: null,
    delayDays: 0,
    status: 'PENDING',
  }))
}

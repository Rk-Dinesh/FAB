import { CheckCircle2, CircleDashed, Ship } from 'lucide-react'
import { Timeline } from '@/components/shared/Timeline'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'
import { Field, Panel, TabEmpty } from './TabShell'

/** Order 360 → Shipment: booking details and the tracking milestones. */
export function ShipmentTab({ order, portsById }) {
  const shipment = order.shipment

  if (!shipment) {
    return (
      <Panel title="Shipment" padded>
        <TabEmpty
          icon={Ship}
          title="Not booked yet"
          description="Booking opens once the order reaches ready-to-ship."
        />
      </Panel>
    )
  }

  const portName = (id) => portsById?.[id]?.name ?? id

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel title="Booking" className="lg:col-span-2">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Reference" value={shipment.reference} />
          <Field label="Mode" value={shipment.mode === 'AIR' ? 'Air freight' : 'Ocean freight'} />
          <Field label="Carrier" value={shipment.carrier} />
          <Field
            label={shipment.mode === 'AIR' ? 'AWB' : 'Bill of lading'}
            value={shipment.blNumber}
          />
          <Field label="Container" value={shipment.containerNumber ?? '—'} hint={shipment.containerType} />
          <Field label="Incoterm" value={shipment.incoterm} />
          <Field label="Origin" value={portName(shipment.originPortId)} />
          <Field label="Destination" value={portName(shipment.destinationPortId)} />
          <Field label="Status" value={<StatusBadge kind="shipment" value={shipment.status} />} />
          <Field label="Cartons" value={formatNumber(shipment.cartons)} />
          <Field label="Gross weight" value={`${formatNumber(shipment.grossWeightKg, 1)} kg`} />
          <Field label="Volume" value={`${shipment.cbm} CBM`} />
          <Field label="ETD" value={formatDate(shipment.etd)} hint={shipment.atd ? `sailed ${formatDate(shipment.atd)}` : undefined} />
          <Field label="ETA" value={formatDate(shipment.eta)} hint={shipment.ata ? `arrived ${formatDate(shipment.ata)}` : undefined} />
          <Field label="Freight cost" value={formatCurrency(shipment.freightCostUsd, 'USD')} />
        </dl>
        {shipment.notes && (
          <p className="mt-4 rounded-lg border border-border bg-surface-2/40 p-3 text-sm text-muted">
            {shipment.notes}
          </p>
        )}
      </Panel>

      <Panel title="Tracking">
        <Timeline
          relative={false}
          items={shipment.milestones.map((milestone, index) => ({
            id: `${shipment.id}-${index}`,
            title: milestone.label,
            at: `${milestone.date}T09:00:00.000Z`,
            tone: milestone.done ? 'success' : 'default',
            icon: milestone.done ? CheckCircle2 : CircleDashed,
            done: milestone.done,
          }))}
        />
      </Panel>
    </div>
  )
}

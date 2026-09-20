import { useMemo } from 'react'
import {
  Banknote,
  FileSignature,
  Mail,
  MessageSquare,
  Package,
  Phone,
  Shirt,
  Ship,
  StickyNote,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui'
import { Timeline } from '@/components/shared/Timeline'
import { Panel } from './TabShell'

const ACTIVITY_ICONS = {
  CALL: Phone,
  EMAIL: Mail,
  MEETING: Users,
  NOTE: StickyNote,
  STATUS_CHANGE: Package,
}

/**
 * Order 360 → Activity: a single stream merging the logged activity with the
 * events that can be derived from the record itself.
 */
export function ActivityTab({ order, employeesById }) {
  const items = useMemo(() => {
    const entries = []

    for (const activity of order.activities ?? []) {
      entries.push({
        id: activity.id,
        title: activity.summary,
        at: activity.at,
        icon: ACTIVITY_ICONS[activity.type] ?? StickyNote,
        tone: activity.type === 'STATUS_CHANGE' ? 'primary' : 'default',
        description: employeesById?.[activity.actorId]?.name,
        meta: (
          <Badge size="sm" tone="outline">
            {activity.type.replace('_', ' ').toLowerCase()}
          </Badge>
        ),
      })
    }

    for (const update of order.clientUpdates ?? []) {
      entries.push({
        id: update.id,
        title: update.subject,
        description: update.body,
        at: update.sentAt,
        icon: MessageSquare,
        tone: 'info',
        meta: (
          <Badge size="sm" tone={update.acknowledged ? 'success' : 'default'}>
            {update.channel.toLowerCase()} · {update.acknowledged ? 'acknowledged' : 'sent'}
          </Badge>
        ),
      })
    }

    for (const sample of order.samples ?? []) {
      if (!sample.decidedAt) continue
      entries.push({
        id: `${sample.id}-decision`,
        title: `${sample.type.replace('_', ' ')} sample ${sample.status.toLowerCase()}`,
        description: sample.comments,
        at: sample.decidedAt,
        icon: Shirt,
        tone: sample.status === 'APPROVED' ? 'success' : 'danger',
      })
    }

    for (const quotation of order.quotations ?? []) {
      entries.push({
        id: `${quotation.id}-sent`,
        title: `Quotation ${quotation.reference} v${quotation.version} sent`,
        description: quotation.notes,
        at: quotation.sentAt,
        icon: FileSignature,
        tone: quotation.status === 'ACCEPTED' ? 'success' : 'default',
      })
    }

    if (order.shipment?.atd) {
      entries.push({
        id: `${order.shipment.id}-departed`,
        title: `Shipment departed on ${order.shipment.carrier}`,
        description: `${order.shipment.blNumber} · ${order.shipment.cartons} cartons`,
        at: `${order.shipment.atd}T09:00:00.000Z`,
        icon: Ship,
        tone: 'success',
      })
    }

    for (const invoice of order.invoices ?? []) {
      entries.push({
        id: `${invoice.id}-raised`,
        title: `Invoice ${invoice.number} raised`,
        description: `${invoice.kind?.toLowerCase() ?? 'commercial'} invoice`,
        at: `${invoice.issuedAt}T09:00:00.000Z`,
        icon: Banknote,
        tone: invoice.status === 'PAID' ? 'success' : invoice.status === 'OVERDUE' ? 'danger' : 'default',
      })
    }

    return entries.sort((left, right) => (left.at < right.at ? 1 : -1))
  }, [order, employeesById])

  return (
    <Panel
      title="Activity"
      description="Everything that has happened on this order, newest first."
    >
      <Timeline
        items={items}
        emptyTitle="Nothing logged yet"
        emptyDescription="Calls, emails, status changes and client updates all appear here."
      />
    </Panel>
  )
}

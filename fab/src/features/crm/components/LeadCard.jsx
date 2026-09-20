import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CalendarClock, GripVertical, MapPin } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/utils/format'

/**
 * A draggable lead card on the kanban board.
 * @param {{lead: object, onOpen: (lead: object) => void, overlay?: boolean}} props
 */
export function LeadCard({ lead, onOpen, overlay = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { lead },
    disabled: overlay,
  })

  const style = overlay
    ? undefined
    : { transform: CSS.Translate.toString(transform), transition }

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      className={cn(
        'group rounded-lg border border-border bg-surface p-3 transition-colors',
        'hover:border-border-strong',
        isDragging && 'opacity-40',
        overlay && 'rotate-2 shadow-xl',
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Drag ${lead.company}`}
          className="mt-0.5 cursor-grab text-muted opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onOpen(lead)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-sm font-medium text-text">{lead.company}</p>
          <p className="mt-0.5 truncate text-xs text-muted">
            {lead.contactName} · {lead.segment}
          </p>
        </button>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3" aria-hidden="true" />
          {lead.city}
        </span>
        {lead.nextActionDate && (
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="size-3" aria-hidden="true" />
            {formatDate(lead.nextActionDate, 'dd MMM')}
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold tabular-nums text-text">
          {formatCurrency(lead.estimatedValueUsd, 'USD', { compact: true })}
        </span>
        <Badge size="sm" tone={lead.probability >= 70 ? 'success' : lead.probability >= 40 ? 'warning' : 'default'}>
          {lead.probability}%
        </Badge>
      </div>
    </div>
  )
}

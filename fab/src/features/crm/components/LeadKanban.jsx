import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/utils/cn'
import { LEAD_STAGES } from '@/config/statuses'
import { formatCurrency } from '@/utils/format'
import { LeadCard } from './LeadCard'

const STAGES = Object.keys(LEAD_STAGES)

/**
 * Drag-and-drop pipeline board. Dropping a card onto another column changes the
 * lead's stage, which is what the list view then shows.
 *
 * @param {{leads: Array<object>, onStageChange: (leadId: string, stage: string) => void,
 *   onOpen: (lead: object) => void, canEdit?: boolean}} props
 */
export function LeadKanban({ leads, onStageChange, onOpen, canEdit = true }) {
  const [activeId, setActiveId] = useState(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const byStage = useMemo(() => {
    const groups = Object.fromEntries(STAGES.map((stage) => [stage, []]))
    for (const lead of leads) (groups[lead.stage] ?? groups.NEW).push(lead)
    return groups
  }, [leads])

  const activeLead = leads.find((lead) => lead.id === activeId) ?? null

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null)
    if (!over) return
    // `over` is either a column id or another card; resolve both to a stage.
    const targetStage = STAGES.includes(over.id)
      ? over.id
      : leads.find((lead) => lead.id === over.id)?.stage
    const lead = leads.find((entry) => entry.id === active.id)
    if (targetStage && lead && lead.stage !== targetStage) onStageChange(lead.id, targetStage)
  }

  return (
    <DndContext
      sensors={canEdit ? sensors : []}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-3">
        {STAGES.map((stage) => (
          <KanbanColumn key={stage} stage={stage} leads={byStage[stage]} onOpen={onOpen} />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} onOpen={onOpen} overlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function KanbanColumn({ stage, leads, onOpen }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const meta = LEAD_STAGES[stage]
  const value = leads.reduce((sum, lead) => sum + lead.estimatedValueUsd, 0)

  return (
    <section
      ref={setNodeRef}
      className={cn(
        'flex w-72 shrink-0 flex-col rounded-lg border bg-surface-2/40 transition-colors',
        isOver ? 'border-primary bg-primary-soft/30' : 'border-border',
      )}
      aria-label={`${meta.label} column`}
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className={cn('size-2 rounded-full', toneDot(meta.tone))} aria-hidden="true" />
          <h3 className="text-sm font-semibold text-text">{meta.label}</h3>
          <span className="rounded-full bg-surface px-1.5 text-[11px] font-medium text-muted">
            {leads.length}
          </span>
        </div>
        <span className="text-[11px] tabular-nums text-muted">
          {formatCurrency(value, 'USD', { compact: true })}
        </span>
      </header>

      <SortableContext items={leads.map((lead) => lead.id)} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-24 flex-col gap-2 p-2">
          {leads.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted">Drop a lead here</p>
          ) : (
            leads.map((lead) => <LeadCard key={lead.id} lead={lead} onOpen={onOpen} />)
          )}
        </div>
      </SortableContext>
    </section>
  )
}

/** @param {string} tone */
function toneDot(tone) {
  return {
    default: 'bg-muted',
    info: 'bg-info',
    primary: 'bg-primary',
    warning: 'bg-warning',
    success: 'bg-success',
    danger: 'bg-danger',
  }[tone]
}

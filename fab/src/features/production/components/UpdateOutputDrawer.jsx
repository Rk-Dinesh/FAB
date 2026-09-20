import { useState } from 'react'
import { Button, Drawer, Input, Progress, Select, Textarea } from '@/components/ui'
import { PRODUCTION_STAGES } from '@/config/statuses'
import { formatDate, formatNumber } from '@/utils/format'

const STATUSES = [
  { value: 'NOT_STARTED', label: 'Not started' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'DELAYED', label: 'Delayed' },
  { value: 'COMPLETED', label: 'Completed' },
]

/**
 * Record today's output against one production stage.
 * @param {{stage: object|null, onClose: () => void,
 *   onSave: (stageId: string, update: object) => Promise<void>}} props
 */
export function UpdateOutputDrawer({ stage, onClose, onSave }) {
  const [key, setKey] = useState(stage?.id ?? null)
  const [quantityDone, setQuantityDone] = useState(stage?.quantityDone ?? 0)
  const [status, setStatus] = useState(stage?.status ?? 'NOT_STARTED')
  const [remarks, setRemarks] = useState(stage?.remarks ?? '')
  const [saving, setSaving] = useState(false)

  // Re-seed when a different stage is opened, without a reset effect.
  if (stage && stage.id !== key) {
    setKey(stage.id)
    setQuantityDone(stage.quantityDone)
    setStatus(stage.status)
    setRemarks(stage.remarks ?? '')
  }

  const percent = stage?.quantityPlanned > 0 ? (quantityDone / stage.quantityPlanned) * 100 : 0
  const added = stage ? quantityDone - stage.quantityDone : 0

  const save = async () => {
    setSaving(true)
    try {
      await onSave(stage.id, { quantityDone, status, remarks })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={Boolean(stage)}
      onClose={onClose}
      title="Update output"
      description={
        stage
          ? `${PRODUCTION_STAGES[stage.stage]?.label ?? stage.stage} · ${stage.poNumber} · ${stage.clientName}`
          : undefined
      }
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Save output
          </Button>
        </>
      }
    >
      {stage && (
        <div className="flex flex-col gap-5">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <Detail label="Order quantity" value={`${formatNumber(stage.quantityPlanned)} pcs`} />
            <Detail label="Recorded so far" value={`${formatNumber(stage.quantityDone)} pcs`} />
            <Detail label="Planned window" value={`${formatDate(stage.plannedStart, 'dd MMM')} – ${formatDate(stage.plannedEnd, 'dd MMM')}`} />
            <Detail
              label="Actual start"
              value={stage.actualStart ? formatDate(stage.actualStart) : 'Not started'}
            />
          </dl>

          <div>
            <Input
              type="number"
              min="0"
              max={stage.quantityPlanned}
              label="Cumulative quantity done"
              value={quantityDone}
              onChange={(event) => setQuantityDone(Number(event.target.value) || 0)}
              hint={
                added === 0
                  ? 'Enter the running total, not today’s increment.'
                  : added > 0
                    ? `+${formatNumber(added)} pcs since the last update`
                    : `${formatNumber(added)} pcs — this reduces the recorded total`
              }
            />
            <Progress
              className="mt-3"
              value={percent}
              showValue
              label="Stage completion"
              tone={percent >= 100 ? 'success' : status === 'DELAYED' ? 'danger' : 'primary'}
            />
          </div>

          <Select
            label="Stage status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            options={STATUSES}
            hint="Leaving this alone lets the status follow the quantity automatically."
          />

          <Textarea
            label="Remarks"
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            placeholder="Anything the merchandiser should pass on to the client."
          />
        </div>
      )}
    </Drawer>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-text">{value}</dd>
    </div>
  )
}

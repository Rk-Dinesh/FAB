import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button, Modal, Textarea } from '@/components/ui'

const REJECT_PRESETS = [
  'Measurement out of tolerance — correct the pattern and resubmit.',
  'Shade does not match the approved lab dip.',
  'Print or embroidery placement is off the tech pack.',
  'Construction differs from the approved standard.',
]

/**
 * Approve or reject a sample, with a comment. Rejection requires one — that
 * comment is what the factory works from.
 *
 * @param {{sample: object|null, decision: 'APPROVED'|'REJECTED'|null,
 *   onClose: () => void, onConfirm: (comments: string) => Promise<void>}} props
 */
export function SampleDecisionModal({ sample, decision, onClose, onConfirm }) {
  const [comments, setComments] = useState('')
  const [saving, setSaving] = useState(false)
  const [touched, setTouched] = useState(false)

  const rejecting = decision === 'REJECTED'
  const open = Boolean(sample && decision)

  // Reset when a different sample/decision is opened. Adjusting state during
  // render is the documented alternative to a reset effect.
  const requestKey = open ? `${sample.id}:${decision}` : null
  const [lastKey, setLastKey] = useState(requestKey)
  if (requestKey !== lastKey) {
    setLastKey(requestKey)
    setComments('')
    setTouched(false)
  }

  const invalid = rejecting && comments.trim().length < 10

  const confirm = async () => {
    setTouched(true)
    if (invalid) return
    setSaving(true)
    try {
      await onConfirm(comments.trim())
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={rejecting ? 'Reject this sample' : 'Approve this sample'}
      description={
        sample
          ? `${sample.reference} · ${sample.type.replace('_', ' ')} sample for ${sample.styleName} (${sample.poNumber})`
          : undefined
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant={rejecting ? 'danger' : 'success'} onClick={confirm} loading={saving}>
            {rejecting ? (
              <>
                <XCircle className="size-4" /> Reject sample
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" /> Approve sample
              </>
            )}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Textarea
          label={rejecting ? 'What needs to change?' : 'Comments (optional)'}
          value={comments}
          onChange={(event) => setComments(event.target.value)}
          placeholder={
            rejecting
              ? 'Be specific — this is what the factory will work from.'
              : 'Anything the factory should carry into bulk.'
          }
          error={touched && invalid ? 'Give at least a sentence explaining the rejection.' : undefined}
          rows={4}
          required={rejecting}
        />

        {rejecting && (
          <div className="flex flex-wrap gap-2">
            {REJECT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setComments(preset)}
                className="rounded-full border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:border-primary hover:text-primary"
              >
                {preset.split('—')[0].trim()}
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

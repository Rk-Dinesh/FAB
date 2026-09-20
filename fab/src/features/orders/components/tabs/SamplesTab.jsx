import { Shirt } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Badge } from '@/components/ui'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { SAMPLE_TYPES } from '@/config/statuses'
import { formatDate } from '@/utils/format'
import { MiniTable, Panel, TabEmpty } from './TabShell'

const ORDERED_TYPES = ['PROTO', 'FIT', 'SIZE_SET', 'PP']

/** Order 360 → Samples & approvals. */
export function SamplesTab({ order }) {
  const samples = order.samples ?? []

  return (
    <div className="flex flex-col gap-4">
      <Panel title="Development stages" description="Where this style stands on each sample type.">
        <ol className="grid gap-3 sm:grid-cols-4">
          {ORDERED_TYPES.map((type) => {
            const forType = samples.filter((sample) => sample.type === type)
            const latest = forType[0]
            const state = latest?.status ?? 'NOT_SENT'
            return (
              <li
                key={type}
                className={cn(
                  'rounded-lg border p-3',
                  state === 'APPROVED'
                    ? 'border-success/30 bg-success-soft/40'
                    : state === 'REJECTED'
                      ? 'border-danger/30 bg-danger-soft/40'
                      : state === 'PENDING'
                        ? 'border-warning/30 bg-warning-soft/40'
                        : 'border-border bg-surface-2/30',
                )}
              >
                <p className="text-xs font-medium text-muted">{SAMPLE_TYPES[type].label}</p>
                <p className="mt-1 text-sm font-semibold text-text">
                  {state === 'NOT_SENT' ? 'Not sent' : SAMPLE_TYPES[type].label}
                </p>
                <div className="mt-2">
                  {state === 'NOT_SENT' ? (
                    <Badge size="sm" tone="outline">
                      Not started
                    </Badge>
                  ) : (
                    <StatusBadge kind="approval" value={state} size="sm" />
                  )}
                </div>
                <p className="mt-1.5 text-[11px] text-muted">{SAMPLE_TYPES[type].description}</p>
              </li>
            )
          })}
        </ol>
      </Panel>

      <Panel
        title="Submissions"
        description={`${samples.length} sample${samples.length === 1 ? '' : 's'} sent against this order`}
        padded={samples.length === 0}
      >
        {samples.length === 0 ? (
          <TabEmpty
            icon={Shirt}
            title="No samples yet"
            description="Samples are raised once the tech pack is released."
          />
        ) : (
          <MiniTable head={['Reference', 'Type', 'Sent', 'Due', 'Decision', 'Comments']}>
            {samples.map((sample) => (
              <tr key={sample.id} className="border-b border-border last:border-0">
                <th scope="row" className="px-3 py-2 text-left font-medium text-text">
                  {sample.reference}
                  <span className="ml-1.5 text-xs font-normal text-muted">v{sample.version}</span>
                </th>
                <td className="px-3 py-2">
                  <Badge size="sm" tone="info">
                    {SAMPLE_TYPES[sample.type]?.label ?? sample.type}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-text">{formatDate(sample.sentAt)}</td>
                <td className="px-3 py-2 text-text">{formatDate(sample.dueAt)}</td>
                <td className="px-3 py-2">
                  <StatusBadge kind="approval" value={sample.status} size="sm" />
                </td>
                <td className="max-w-md px-3 py-2 text-xs text-muted">
                  {sample.comments || '—'}
                </td>
              </tr>
            ))}
          </MiniTable>
        )}
      </Panel>
    </div>
  )
}

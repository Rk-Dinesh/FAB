import { AlertTriangle, CheckCircle2, CircleDashed, Clock } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Badge } from '@/components/ui'
import { formatDate } from '@/utils/format'
import { MiniTable, Panel } from './TabShell'

const STATUS_META = {
  DONE: { label: 'On time', tone: 'success', icon: CheckCircle2 },
  LATE: { label: 'Late', tone: 'danger', icon: AlertTriangle },
  IN_PROGRESS: { label: 'In progress', tone: 'primary', icon: Clock },
  PENDING: { label: 'Pending', tone: 'default', icon: CircleDashed },
}

/** Order 360 → T&A: planned against actual, with slippage called out in red. */
export function TnaTab({ order }) {
  const milestones = order.milestones ?? []
  const late = milestones.filter((milestone) => milestone.status === 'LATE')
  const done = milestones.filter((milestone) => milestone.status === 'DONE').length
  const worst = late.reduce((max, milestone) => Math.max(max, milestone.delayDays), 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Milestones" value={milestones.length} />
        <Stat label="Hit on time" value={done} tone="success" />
        <Stat label="Missed" value={late.length} tone={late.length > 0 ? 'danger' : 'default'} />
        <Stat label="Worst slippage" value={worst > 0 ? `${worst} days` : '—'} tone={worst > 0 ? 'danger' : 'default'} />
      </div>

      <Panel
        title="Time & action calendar"
        description="Planned against actual. Anything red has pushed the ex-factory date."
        padded={false}
      >
        <MiniTable
          head={[
            'Milestone',
            'Owner',
            'Planned',
            'Actual',
            { label: 'Variance', align: 'right' },
            'Status',
          ]}
        >
          {milestones.map((milestone) => {
            const meta = STATUS_META[milestone.status] ?? STATUS_META.PENDING
            const Icon = meta.icon
            return (
              <tr
                key={milestone.name}
                className={cn(
                  'border-b border-border last:border-0',
                  milestone.status === 'LATE' && 'bg-danger-soft/30',
                )}
              >
                <th scope="row" className="px-3 py-2 text-left font-medium text-text">
                  {milestone.name}
                </th>
                <td className="px-3 py-2 text-muted">{milestone.owner}</td>
                <td className="px-3 py-2 text-text">{formatDate(milestone.plannedDate)}</td>
                <td className="px-3 py-2 text-text">
                  {milestone.actualDate ? formatDate(milestone.actualDate) : <span className="text-muted">—</span>}
                </td>
                <td
                  className={cn(
                    'px-3 py-2 text-right tabular-nums',
                    milestone.delayDays > 0 ? 'font-semibold text-danger' : 'text-muted',
                  )}
                >
                  {milestone.delayDays > 0 ? `+${milestone.delayDays}d` : milestone.actualDate ? 'on time' : '—'}
                </td>
                <td className="px-3 py-2">
                  <Badge tone={meta.tone} size="sm" icon={<Icon className="size-3" aria-hidden="true" />}>
                    {meta.label}
                  </Badge>
                </td>
              </tr>
            )
          })}
        </MiniTable>
      </Panel>

      {late.length > 0 && (
        <Panel title="Impact on delivery">
          <p className="text-sm leading-relaxed text-muted">
            The slippage on{' '}
            <span className="font-medium text-text">{late.map((m) => m.name).join(', ')}</span> has moved
            the ex-factory date from{' '}
            <span className="font-medium text-text">{formatDate(order.exFactoryDate)}</span> to{' '}
            <span className="font-medium text-danger">
              {formatDate(order.revisedExFactoryDate ?? order.exFactoryDate)}
            </span>
            . {order.clientName} has been notified and the revised date is reflected on the shipment plan.
          </p>
        </Panel>
      )}
    </div>
  )
}

function Stat({ label, value, tone = 'default' }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p
        className={cn(
          'mt-1 text-xl font-semibold tabular-nums',
          tone === 'danger' ? 'text-danger' : tone === 'success' ? 'text-success' : 'text-text',
        )}
      >
        {value}
      </p>
    </div>
  )
}

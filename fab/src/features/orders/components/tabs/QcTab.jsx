import { ClipboardCheck } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Badge } from '@/components/ui'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate, formatNumber } from '@/utils/format'
import { Field, MiniTable, Panel, TabEmpty } from './TabShell'

const SEVERITY_TONES = { CRITICAL: 'danger', MAJOR: 'warning', MINOR: 'default' }

/** Order 360 → QC: AQL inspections and the defects behind them. */
export function QcTab({ order }) {
  const inspections = order.inspections ?? []
  const defects = order.defects ?? []

  if (inspections.length === 0) {
    return (
      <Panel title="Quality" padded>
        <TabEmpty
          icon={ClipboardCheck}
          title="No inspections recorded"
          description="Inline checks start during stitching; the final AQL audit runs before dispatch."
        />
      </Panel>
    )
  }

  const passed = inspections.filter((entry) => entry.result === 'PASS').length

  return (
    <div className="flex flex-col gap-4">
      <Panel title="Inspection summary">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Inspections" value={inspections.length} />
          <Field
            label="Passed"
            value={`${passed} of ${inspections.length}`}
            tone={passed === inspections.length ? 'success' : undefined}
          />
          <Field label="Defects logged" value={defects.length} />
          <Field
            label="Open defects"
            value={defects.filter((defect) => defect.status === 'OPEN').length}
            tone={defects.some((defect) => defect.status === 'OPEN') ? 'danger' : 'success'}
          />
        </dl>
      </Panel>

      <Panel title="Inspections" description="AQL 2.5, general inspection level II." padded={false}>
        <MiniTable
          head={[
            'Reference',
            'Type',
            { label: 'Offered', align: 'right' },
            { label: 'Sample', align: 'right' },
            { label: 'Accept / reject', align: 'right' },
            { label: 'Found', align: 'right' },
            'Result',
            'Date',
          ]}
        >
          {inspections.map((inspection) => (
            <tr
              key={inspection.id}
              className={cn(
                'border-b border-border last:border-0',
                inspection.result === 'FAIL' && 'bg-danger-soft/30',
              )}
            >
              <th scope="row" className="px-3 py-2 text-left font-medium text-text">
                {inspection.reference}
              </th>
              <td className="px-3 py-2">
                <Badge size="sm" tone={inspection.type === 'FINAL' ? 'primary' : 'info'}>
                  {inspection.type.toLowerCase()}
                </Badge>
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-text">
                {formatNumber(inspection.offeredQuantity)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-text">
                {formatNumber(inspection.sampleSize)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-muted">
                {inspection.acceptOn} / {inspection.rejectOn}
              </td>
              <td
                className={cn(
                  'px-3 py-2 text-right font-medium tabular-nums',
                  inspection.defectsFound > inspection.acceptOn ? 'text-danger' : 'text-text',
                )}
              >
                {inspection.defectsFound}
              </td>
              <td className="px-3 py-2">
                <StatusBadge kind="inspection" value={inspection.result} size="sm" />
              </td>
              <td className="px-3 py-2 text-text">{formatDate(inspection.inspectedAt)}</td>
            </tr>
          ))}
        </MiniTable>
      </Panel>

      {defects.length > 0 && (
        <Panel title="Defect log" padded={false}>
          <MiniTable
            head={['Defect', 'Area', 'Severity', { label: 'Qty', align: 'right' }, 'Stage', 'Corrective action', 'Status']}
          >
            {defects.map((defect) => (
              <tr key={defect.id} className="border-b border-border last:border-0">
                <th scope="row" className="px-3 py-2 text-left font-medium text-text">
                  {defect.type}
                </th>
                <td className="px-3 py-2 text-muted">{defect.area}</td>
                <td className="px-3 py-2">
                  <Badge tone={SEVERITY_TONES[defect.severity]} size="sm" dot>
                    {defect.severity.toLowerCase()}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-text">{defect.quantity}</td>
                <td className="px-3 py-2 text-xs text-muted">{defect.stage.replace(/_/g, ' ').toLowerCase()}</td>
                <td className="max-w-sm px-3 py-2 text-xs text-muted">{defect.correctiveAction}</td>
                <td className="px-3 py-2">
                  <Badge tone={defect.status === 'CLOSED' ? 'success' : 'warning'} size="sm" dot>
                    {defect.status.toLowerCase()}
                  </Badge>
                </td>
              </tr>
            ))}
          </MiniTable>
        </Panel>
      )}
    </div>
  )
}

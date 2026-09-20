import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, Shirt, XCircle } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Badge, Button, Card, CardBody, EmptyState, Skeleton, Tabs } from '@/components/ui'
import { KpiCard, KpiGrid, PageHeader, StatusBadge } from '@/components/shared'
import { useAsync } from '@/hooks'
import { toast } from '@/store/toastStore'
import { decideSample, sampleService } from '@/services/designService'
import { recordAudit } from '@/services/adminService'
import { SAMPLE_TYPES } from '@/config/statuses'
import { formatDate } from '@/utils/format'
import { usePortalClient } from '../hooks/usePortalClient'
import { SampleDecisionModal } from '@/features/design/components/SampleDecisionModal'

/**
 * Client portal → Approvals. A decision here writes straight into the same
 * sample record the internal Design module reads, so it shows up on both sides.
 */
export function PortalApprovalsPage() {
  const { clientId, client } = usePortalClient()
  const [tab, setTab] = useState('pending')
  const [pending, setPending] = useState({ sample: null, decision: null })

  const load = useCallback(() => sampleService.list({ filters: { clientId } }), [clientId])
  const { data, loading, error, reload } = useAsync(load, [clientId], {
    enabled: Boolean(clientId),
  })
  const samples = useMemo(() => data ?? [], [data])

  const decide = useCallback(
    async (comments) => {
      const { sample, decision } = pending
      await decideSample(sample.id, decision, comments, 'CLIENT')
      void recordAudit({
        action: decision === 'APPROVED' ? 'SAMPLE_APPROVED' : 'SAMPLE_REJECTED',
        module: 'design',
        entity: sample.reference,
        description: `${client?.name ?? 'Client'} ${decision === 'APPROVED' ? 'approved' : 'rejected'} ${sample.reference}`,
        actorRole: 'CLIENT',
      })
      toast[decision === 'APPROVED' ? 'success' : 'error'](
        decision === 'APPROVED' ? 'Sample approved' : 'Sample rejected',
        'Your decision has gone straight to the merchandising team.',
      )
      reload()
    },
    [pending, client, reload],
  )

  const grouped = useMemo(
    () => ({
      pending: samples.filter((sample) => sample.status === 'PENDING'),
      decided: samples.filter((sample) => sample.status !== 'PENDING'),
    }),
    [samples],
  )

  const visible = tab === 'pending' ? grouped.pending : grouped.decided

  return (
    <div>
      <PageHeader
        title="Sample approvals"
        description="Approve or reject the samples we've sent you. Your comments go straight to the factory."
      />

      <KpiGrid className="mb-5" columns={3}>
        <KpiCard
          label="Waiting on you"
          value={grouped.pending.length}
          icon={Clock}
          tone={grouped.pending.length > 0 ? 'warning' : 'success'}
          loading={loading}
        />
        <KpiCard
          label="Approved"
          value={samples.filter((sample) => sample.status === 'APPROVED').length}
          icon={CheckCircle2}
          tone="success"
          loading={loading}
        />
        <KpiCard
          label="Rejected"
          value={samples.filter((sample) => sample.status === 'REJECTED').length}
          icon={XCircle}
          tone="danger"
          loading={loading}
        />
      </KpiGrid>

      <Tabs
        className="mb-4"
        variant="pill"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'pending', label: 'Waiting on you', count: grouped.pending.length },
          { value: 'decided', label: 'Decided', count: grouped.decided.length },
        ]}
      />

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <EmptyState title="Couldn’t load your samples" description={error.message} />
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={tab === 'pending' ? CheckCircle2 : Shirt}
            title={tab === 'pending' ? 'Nothing waiting on you' : 'No decisions yet'}
            description={
              tab === 'pending'
                ? 'We’ll email you as soon as the next sample is ready.'
                : 'Samples you’ve approved or rejected will be listed here.'
            }
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((sample) => {
            const overdue =
              sample.status === 'PENDING' && new Date(sample.dueAt) < new Date()
            return (
              <Card
                key={sample.id}
                className={cn(overdue && 'border-warning/40')}
              >
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="info" size="sm">
                          {SAMPLE_TYPES[sample.type]?.label ?? sample.type}
                        </Badge>
                        <span className="text-sm font-semibold text-text">{sample.reference}</span>
                        <span className="text-xs text-muted">v{sample.version}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {sample.styleName} ·{' '}
                        <Link
                          to={`/portal/orders/${sample.orderId}`}
                          className="text-primary hover:underline"
                        >
                          {sample.poNumber}
                        </Link>
                      </p>
                    </div>
                    <StatusBadge kind="approval" value={sample.status} size="sm" />
                  </div>

                  <dl className="mt-3 grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <dt className="text-muted">Sent</dt>
                      <dd className="text-text">{formatDate(sample.sentAt, 'dd MMM')}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Due back</dt>
                      <dd className={cn('text-text', overdue && 'font-medium text-warning')}>
                        {formatDate(sample.dueAt, 'dd MMM')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Size</dt>
                      <dd className="text-text">{sample.sizeSubmitted}</dd>
                    </div>
                  </dl>

                  {sample.comments && (
                    <p className="mt-3 rounded-lg border border-border bg-surface-2/40 p-2.5 text-xs leading-relaxed text-muted">
                      {sample.comments}
                    </p>
                  )}

                  {sample.status === 'PENDING' && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        className="flex-1"
                        onClick={() => setPending({ sample, decision: 'APPROVED' })}
                      >
                        <CheckCircle2 className="size-4" /> Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        className="flex-1"
                        onClick={() => setPending({ sample, decision: 'REJECTED' })}
                      >
                        <XCircle className="size-4" /> Reject
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      <SampleDecisionModal
        sample={pending.sample}
        decision={pending.decision}
        onClose={() => setPending({ sample: null, decision: null })}
        onConfirm={decide}
      />
    </div>
  )
}

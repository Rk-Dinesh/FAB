import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ClipboardCheck, Plus, XCircle } from 'lucide-react'
import { z } from 'zod'
import { cn } from '@/utils/cn'
import { Badge, Button } from '@/components/ui'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader, RecordDrawer, StatusBadge } from '@/components/shared'
import { useAsync } from '@/hooks'
import { useCan } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { aqlPlan, inspectionService } from '@/services/qualityService'
import { recordAudit } from '@/services/adminService'
import { table } from '@/mocks/db'
import { formatDate, formatNumber, formatPercent } from '@/utils/format'

const schema = z
  .object({
    orderId: z.string().min(1, 'Pick an order'),
    type: z.enum(['INLINE', 'FINAL']),
    checklistId: z.string().min(1, 'Pick a checklist'),
    offeredQuantity: z.coerce.number().int().positive('Offered quantity must be above zero'),
    defectsFound: z.coerce.number().int().min(0, 'Cannot be negative'),
    inspectorId: z.string().min(1, 'Assign an inspector'),
    remarks: z.string().optional().or(z.literal('')),
  })
  .refine((values) => values.defectsFound <= values.offeredQuantity, {
    message: 'More defects than units offered',
    path: ['defectsFound'],
  })

/** Quality → Inspections: AQL 2.5 inline and final audits. */
export function InspectionsPage() {
  const can = useCan()
  const [filters, setFilters] = useState({})
  const [drawerOpen, setDrawerOpen] = useState(false)

  const load = useCallback(() => inspectionService.list(), [])
  const { data, loading, error, reload } = useAsync(load)
  const inspections = useMemo(() => data ?? [], [data])

  const orders = useMemo(() => table('orders').filter((order) => order.statusIndex >= 8), [])
  const inspectors = useMemo(
    () => table('employees').filter((employee) => employee.department === 'Quality'),
    [],
  )
  const checklists = useMemo(() => table('qcChecklists'), [])

  const stats = useMemo(() => {
    const passed = inspections.filter((entry) => entry.result === 'PASS').length
    return {
      total: inspections.length,
      passed,
      failed: inspections.filter((entry) => entry.result === 'FAIL').length,
      passRate: inspections.length > 0 ? (passed / inspections.length) * 100 : 0,
    }
  }, [inspections])

  const save = async (values) => {
    const order = orders.find((entry) => entry.id === values.orderId)
    const plan = aqlPlan(values.offeredQuantity)
    const result = values.defectsFound <= plan.acceptOn ? 'PASS' : 'FAIL'
    const critical = Math.max(0, Math.round(values.defectsFound * 0.08))
    const major = Math.round(values.defectsFound * 0.55)

    const created = await inspectionService.create({
      reference: `QC-${9100 + table('inspections').length}`,
      orderId: order.id,
      poNumber: order.poNumber,
      clientId: order.clientId,
      clientName: order.clientName,
      styleName: order.styleName,
      vendorId: order.factoryVendorId,
      type: values.type,
      checklistId: values.checklistId,
      aql: '2.5',
      inspectionLevel: 'GII',
      offeredQuantity: values.offeredQuantity,
      sampleSize: plan.sampleSize,
      acceptOn: plan.acceptOn,
      rejectOn: plan.rejectOn,
      defectsFound: values.defectsFound,
      criticalCount: critical,
      majorCount: major,
      minorCount: values.defectsFound - major - critical,
      result,
      inspectedAt: new Date().toISOString(),
      inspectorId: values.inspectorId,
      remarks:
        values.remarks ||
        (result === 'FAIL'
          ? 'Lot rejected — 100% re-check and re-offer.'
          : 'Lot accepted. Cartons sealed for dispatch.'),
    })

    void recordAudit({
      action: 'INSPECTION_RECORDED',
      module: 'quality',
      entity: created.reference,
      description: `Recorded ${values.type.toLowerCase()} inspection ${created.reference} — ${result.toLowerCase()}`,
    })
    toast[result === 'PASS' ? 'success' : 'error'](
      `Inspection ${result === 'PASS' ? 'passed' : 'failed'}`,
      `${created.reference} · ${values.defectsFound} defects against an accept-on of ${plan.acceptOn}`,
    )
    reload()
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'reference',
        header: 'Inspection',
        cell: ({ getValue }) => <span className="font-medium text-text">{getValue()}</span>,
      },
      {
        accessorKey: 'poNumber',
        header: 'Order',
        cell: ({ row }) => (
          <span onClick={(event) => event.stopPropagation()} role="presentation">
            <Link to={`/app/orders/${row.original.orderId}`} className="text-primary hover:underline">
              {row.original.poNumber}
            </Link>
          </span>
        ),
      },
      { accessorKey: 'clientName', header: 'Client' },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ getValue }) => (
          <Badge tone={getValue() === 'FINAL' ? 'primary' : 'info'} size="sm">
            {getValue().toLowerCase()}
          </Badge>
        ),
      },
      {
        accessorKey: 'offeredQuantity',
        header: 'Offered',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatNumber(getValue()),
      },
      { accessorKey: 'sampleSize', header: 'Sample', meta: { align: 'right' } },
      {
        id: 'acceptReject',
        accessorFn: (row) => row.acceptOn,
        header: 'Ac / Re',
        meta: { align: 'right', csv: (row) => `${row.acceptOn}/${row.rejectOn}` },
        cell: ({ row }) => (
          <span className="tabular-nums text-muted">
            {row.original.acceptOn} / {row.original.rejectOn}
          </span>
        ),
      },
      {
        accessorKey: 'defectsFound',
        header: 'Found',
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span
            className={cn(
              'tabular-nums',
              row.original.defectsFound > row.original.acceptOn
                ? 'font-semibold text-danger'
                : 'text-text',
            )}
          >
            {row.original.defectsFound}
          </span>
        ),
      },
      {
        id: 'severity',
        header: 'Cr / Ma / Mi',
        enableSorting: false,
        meta: { csv: (row) => `${row.criticalCount}/${row.majorCount}/${row.minorCount}` },
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-muted">
            {row.original.criticalCount} / {row.original.majorCount} / {row.original.minorCount}
          </span>
        ),
      },
      {
        accessorKey: 'result',
        header: 'Result',
        cell: ({ getValue }) => <StatusBadge kind="inspection" value={getValue()} />,
      },
      {
        accessorKey: 'inspectedAt',
        header: 'Date',
        cell: ({ getValue }) => formatDate(getValue()),
      },
    ],
    [],
  )

  const filterConfig = [
    {
      key: 'type',
      label: 'Type',
      width: 'w-40',
      options: [
        { value: 'INLINE', label: 'Inline' },
        { value: 'FINAL', label: 'Final' },
      ],
    },
    {
      key: 'result',
      label: 'Result',
      width: 'w-40',
      options: [
        { value: 'PASS', label: 'Pass' },
        { value: 'FAIL', label: 'Fail' },
      ],
    },
  ]

  const filtered = inspections.filter(
    (entry) =>
      (!filters.type || entry.type === filters.type) &&
      (!filters.result || entry.result === filters.result),
  )

  const fields = [
    {
      name: 'orderId',
      label: 'Order',
      type: 'select',
      required: true,
      full: true,
      options: orders.map((order) => ({
        value: order.id,
        label: `${order.poNumber} — ${order.clientName} · ${order.styleName}`,
      })),
    },
    {
      name: 'type',
      label: 'Inspection type',
      type: 'select',
      required: true,
      options: [
        { value: 'INLINE', label: 'Inline' },
        { value: 'FINAL', label: 'Final' },
      ],
    },
    {
      name: 'checklistId',
      label: 'Checklist',
      type: 'select',
      required: true,
      options: checklists.map((entry) => ({ value: entry.id, label: `${entry.name} (AQL ${entry.aql})` })),
    },
    {
      name: 'offeredQuantity',
      label: 'Quantity offered',
      type: 'number',
      required: true,
      hint: 'Sample size and accept/reject numbers come from the AQL 2.5 table',
    },
    { name: 'defectsFound', label: 'Defects found in the sample', type: 'number', required: true },
    {
      name: 'inspectorId',
      label: 'Inspector',
      type: 'select',
      required: true,
      options: inspectors.map((entry) => ({ value: entry.id, label: entry.name })),
    },
    { name: 'remarks', label: 'Remarks', type: 'textarea' },
  ]

  const defaults = {
    orderId: orders[0]?.id ?? '',
    type: 'FINAL',
    checklistId: 'QCL-001',
    offeredQuantity: 12000,
    defectsFound: 0,
    inspectorId: inspectors[0]?.id ?? '',
    remarks: '',
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Inspections"
        description="Inline and final audits at AQL 2.5, general inspection level II."
        breadcrumbs={[{ label: 'Quality' }, { label: 'Inspections' }]}
        actions={
          can('quality', 'create') && (
            <Button onClick={() => setDrawerOpen(true)}>
              <Plus className="size-4" /> Record inspection
            </Button>
          )
        }
      />

      <KpiGrid className="mb-5">
        <KpiCard label="Inspections" value={stats.total} icon={ClipboardCheck} tone="primary" loading={loading} />
        <KpiCard label="Passed" value={stats.passed} icon={CheckCircle2} tone="success" loading={loading} />
        <KpiCard
          label="Failed"
          value={stats.failed}
          icon={XCircle}
          tone="danger"
          loading={loading}
          onClick={() => setFilters({ result: 'FAIL' })}
        />
        <KpiCard
          label="Pass rate"
          value={formatPercent(stats.passRate, 0)}
          tone={stats.passRate >= 90 ? 'success' : 'warning'}
          loading={loading}
        />
      </KpiGrid>

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={reload}
        filters={<FilterBar filters={filterConfig} values={filters} onChange={setFilters} />}
        exportFileName="apparelflow-inspections"
        searchPlaceholder="Search inspections…"
        emptyTitle="No inspections match these filters"
        initialSort={[{ id: 'inspectedAt', desc: true }]}
        getRowClassName={(row) => (row.result === 'FAIL' ? 'bg-danger-soft/25' : '')}
      />

      <RecordDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Record an inspection"
        description="Sample size and the accept/reject numbers are derived from the AQL 2.5 table."
        schema={schema}
        fields={fields}
        defaultValues={defaults}
        onSubmit={save}
        submitLabel="Save inspection"
        size="lg"
      />
    </div>
  )
}

import { useCallback, useMemo, useState } from 'react'
import { Banknote, Minus, Receipt, Users } from 'lucide-react'
import { Badge, Button, Drawer } from '@/components/ui'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader } from '@/components/shared'
import { useAsync } from '@/hooks'
import { toast } from '@/store/toastStore'
import { payrollService } from '@/services/hrService'
import { table } from '@/mocks/db'
import { formatCurrency, formatDate } from '@/utils/format'

/** HR → Payroll: the monthly run, with a payslip drawer per employee. */
export function PayrollPage() {
  const [filters, setFilters] = useState({})
  const [selected, setSelected] = useState(null)

  const load = useCallback(() => payrollService.list(), [])
  const { data, loading, error, reload } = useAsync(load)
  const payroll = useMemo(() => data ?? [], [data])

  const company = useMemo(() => table('company')[0], [])

  const stats = useMemo(
    () => ({
      employees: payroll.length,
      gross: payroll.reduce((sum, row) => sum + row.gross, 0),
      deductions: payroll.reduce((sum, row) => sum + row.deductions, 0),
      net: payroll.reduce((sum, row) => sum + row.netPay, 0),
    }),
    [payroll],
  )

  const columns = useMemo(
    () => [
      { accessorKey: 'employeeName', header: 'Employee' },
      { accessorKey: 'department', header: 'Department' },
      { accessorKey: 'grade', header: 'Grade' },
      {
        accessorKey: 'gross',
        header: 'Gross',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'INR'),
      },
      {
        accessorKey: 'pf',
        header: 'PF',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'INR'),
      },
      {
        accessorKey: 'tds',
        header: 'TDS',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'INR'),
      },
      {
        accessorKey: 'lopDays',
        header: 'LOP days',
        meta: { align: 'right' },
        cell: ({ getValue }) =>
          getValue() > 0 ? <span className="text-danger">{getValue()}</span> : '—',
      },
      {
        accessorKey: 'deductions',
        header: 'Deductions',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'INR'),
      },
      {
        accessorKey: 'netPay',
        header: 'Net pay',
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <span className="font-medium text-text">{formatCurrency(getValue(), 'INR')}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => (
          <Badge tone="success" size="sm" dot>
            {getValue().toLowerCase()}
          </Badge>
        ),
      },
    ],
    [],
  )

  const filterConfig = [
    {
      key: 'department',
      label: 'Department',
      width: 'w-56',
      options: [...new Set(payroll.map((row) => row.department))].map((name) => ({
        value: name,
        label: name,
      })),
    },
    {
      key: 'lop',
      label: 'Loss of pay',
      width: 'w-44',
      options: [{ value: 'yes', label: 'Has LOP days' }],
    },
  ]

  const filtered = payroll.filter((row) => {
    if (filters.department && row.department !== filters.department) return false
    if (filters.lop === 'yes' && row.lopDays === 0) return false
    return true
  })

  const month = payroll[0]?.month

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Payroll"
        description={month ? `Monthly run for ${month}` : 'Monthly payroll run'}
        breadcrumbs={[{ label: 'HR' }, { label: 'Payroll' }]}
      />

      <KpiGrid className="mb-5">
        <KpiCard label="Employees paid" value={stats.employees} icon={Users} tone="primary" loading={loading} />
        <KpiCard
          label="Gross"
          value={formatCurrency(stats.gross, 'INR', { compact: true })}
          icon={Receipt}
          tone="info"
          loading={loading}
        />
        <KpiCard
          label="Deductions"
          value={formatCurrency(stats.deductions, 'INR', { compact: true })}
          icon={Minus}
          tone="warning"
          loading={loading}
        />
        <KpiCard
          label="Net paid"
          value={formatCurrency(stats.net, 'INR', { compact: true })}
          icon={Banknote}
          tone="success"
          loading={loading}
        />
      </KpiGrid>

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={reload}
        onRowClick={setSelected}
        filters={<FilterBar filters={filterConfig} values={filters} onChange={setFilters} />}
        exportFileName="apparelflow-payroll"
        searchPlaceholder="Search payroll…"
        emptyTitle="No payroll records match these filters"
        initialSort={[{ id: 'netPay', desc: true }]}
        dense
      />

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Payslip"
        description={selected ? `${selected.employeeName} · ${selected.month}` : undefined}
        size="md"
        footer={
          <Button
            variant="secondary"
            onClick={() =>
              toast.info('Demo environment', `${selected?.payslipNumber}.pdf would download here.`)
            }
          >
            Download payslip
          </Button>
        }
      >
        {selected && (
          <div className="flex flex-col gap-5">
            <header className="rounded-lg border border-border bg-surface-2/40 p-4">
              <p className="text-sm font-semibold text-text">{company?.name}</p>
              <p className="text-xs text-muted">
                {company?.addressLine1}, {company?.city}
              </p>
              <p className="mt-3 text-xs text-muted">
                Payslip {selected.payslipNumber} · paid {formatDate(selected.paidAt)}
              </p>
            </header>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Detail label="Employee" value={selected.employeeName} />
              <Detail label="Department" value={selected.department} />
              <Detail label="Grade" value={selected.grade} />
              <Detail label="Month" value={selected.month} />
            </dl>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-text">Earnings</h3>
              <dl className="divide-y divide-border rounded-lg border border-border">
                <Line label="Basic" value={selected.basic} />
                <Line label="HRA" value={selected.hra} />
                <Line label="Allowances" value={selected.allowances} />
                <Line label="Gross" value={selected.gross} emphasis />
              </dl>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-text">Deductions</h3>
              <dl className="divide-y divide-border rounded-lg border border-border">
                <Line label="Provident fund" value={selected.pf} negative />
                <Line label="Professional tax" value={selected.professionalTax} negative />
                <Line label="TDS" value={selected.tds} negative />
                {selected.lopDays > 0 && (
                  <Line label={`Loss of pay (${selected.lopDays}d)`} value={selected.lop} negative />
                )}
                <Line label="Total deductions" value={selected.deductions} negative emphasis />
              </dl>
            </section>

            <div className="flex items-baseline justify-between rounded-lg border border-success/30 bg-success-soft px-4 py-3">
              <span className="text-sm font-medium text-success">Net pay</span>
              <span className="text-lg font-semibold tabular-nums text-success">
                {formatCurrency(selected.netPay, 'INR')}
              </span>
            </div>
          </div>
        )}
      </Drawer>
    </div>
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

function Line({ label, value, negative = false, emphasis = false }) {
  return (
    <div className="flex items-baseline justify-between gap-2 px-3 py-2">
      <dt className={emphasis ? 'text-sm font-medium text-text' : 'text-sm text-muted'}>{label}</dt>
      <dd
        className={
          emphasis
            ? 'text-sm font-semibold tabular-nums text-text'
            : 'text-sm tabular-nums text-text'
        }
      >
        {negative && '− '}
        {formatCurrency(value, 'INR')}
      </dd>
    </div>
  )
}

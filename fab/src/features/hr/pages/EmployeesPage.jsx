import { useCallback, useMemo, useState } from 'react'
import { Briefcase, CalendarDays, Users, Wallet } from 'lucide-react'
import { Avatar, Badge, Drawer } from '@/components/ui'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader } from '@/components/shared'
import { useAsync } from '@/hooks'
import { useCan } from '@/store/authStore'
import { employeeService } from '@/services/hrService'
import { formatCurrency, formatDate } from '@/utils/format'

/** HR → Employees: our own staff, not the factories'. */
export function EmployeesPage() {
  const can = useCan()
  const showPay = can('hr', 'view')
  const [filters, setFilters] = useState({})
  const [selected, setSelected] = useState(null)

  const load = useCallback(() => employeeService.list(), [])
  const { data, loading, error, reload } = useAsync(load)
  const employees = useMemo(() => data ?? [], [data])

  const byId = useMemo(
    () => Object.fromEntries(employees.map((employee) => [employee.id, employee])),
    [employees],
  )

  const stats = useMemo(
    () => ({
      total: employees.length,
      departments: new Set(employees.map((employee) => employee.department)).size,
      contract: employees.filter((employee) => employee.employmentType === 'CONTRACT').length,
      monthlyCost: employees.reduce((sum, employee) => sum + employee.monthlyCtc, 0),
    }),
    [employees],
  )

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Employee',
        cell: ({ row }) => (
          <span className="flex items-center gap-2.5">
            <Avatar name={row.original.name} size="sm" />
            <span className="flex flex-col leading-tight">
              <span className="font-medium text-text">{row.original.name}</span>
              <span className="text-xs text-muted">{row.original.code}</span>
            </span>
          </span>
        ),
      },
      { accessorKey: 'title', header: 'Title' },
      {
        accessorKey: 'department',
        header: 'Department',
        cell: ({ getValue }) => (
          <Badge tone="outline" size="sm">
            {getValue()}
          </Badge>
        ),
      },
      { accessorKey: 'grade', header: 'Grade' },
      { accessorKey: 'location', header: 'Location' },
      {
        accessorKey: 'employmentType',
        header: 'Type',
        cell: ({ getValue }) => (
          <Badge tone={getValue() === 'FULL_TIME' ? 'success' : 'warning'} size="sm" dot>
            {getValue() === 'FULL_TIME' ? 'Full time' : 'Contract'}
          </Badge>
        ),
      },
      {
        accessorKey: 'joinedAt',
        header: 'Joined',
        cell: ({ getValue }) => formatDate(getValue()),
      },
      {
        accessorKey: 'leaveBalance',
        header: 'Leave bal.',
        meta: { align: 'right' },
        cell: ({ getValue }) => `${getValue()} d`,
      },
      ...(showPay
        ? [
            {
              accessorKey: 'monthlyCtc',
              header: 'Monthly CTC',
              meta: { align: 'right' },
              cell: ({ getValue }) => formatCurrency(getValue(), 'INR'),
            },
          ]
        : []),
    ],
    [showPay],
  )

  const filterConfig = [
    {
      key: 'department',
      label: 'Department',
      width: 'w-56',
      options: [...new Set(employees.map((employee) => employee.department))].map((name) => ({
        value: name,
        label: name,
      })),
    },
    {
      key: 'employmentType',
      label: 'Type',
      width: 'w-44',
      options: [
        { value: 'FULL_TIME', label: 'Full time' },
        { value: 'CONTRACT', label: 'Contract' },
      ],
    },
    {
      key: 'location',
      label: 'Location',
      width: 'w-48',
      options: [...new Set(employees.map((employee) => employee.location))].map((location) => ({
        value: location,
        label: location,
      })),
    },
  ]

  const filtered = employees.filter((employee) =>
    Object.entries(filters).every(([key, value]) => !value || employee[key] === value),
  )

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Employees"
        description="The buying house team — merchandising, design, sourcing, production, QC and support."
        breadcrumbs={[{ label: 'HR' }, { label: 'Employees' }]}
      />

      <KpiGrid className="mb-5">
        <KpiCard label="Headcount" value={stats.total} icon={Users} tone="primary" loading={loading} />
        <KpiCard label="Departments" value={stats.departments} icon={Briefcase} tone="info" loading={loading} />
        <KpiCard label="On contract" value={stats.contract} icon={CalendarDays} tone="warning" loading={loading} />
        {showPay && (
          <KpiCard
            label="Monthly payroll cost"
            value={formatCurrency(stats.monthlyCost, 'INR', { compact: true })}
            icon={Wallet}
            tone="success"
            loading={loading}
          />
        )}
      </KpiGrid>

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={reload}
        onRowClick={setSelected}
        filters={<FilterBar filters={filterConfig} values={filters} onChange={setFilters} />}
        exportFileName="apparelflow-employees"
        searchPlaceholder="Search employees…"
        emptyTitle="No employees match these filters"
        initialSort={[{ id: 'name', desc: false }]}
      />

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name}
        description={selected ? `${selected.title} · ${selected.department}` : undefined}
        size="md"
      >
        {selected && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <Avatar name={selected.name} size="xl" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text">{selected.name}</p>
                <p className="text-sm text-muted">{selected.title}</p>
                <p className="mt-1 text-xs text-muted">{selected.email}</p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Detail label="Employee code" value={selected.code} />
              <Detail label="Grade" value={selected.grade} />
              <Detail label="Department" value={selected.department} />
              <Detail label="Location" value={selected.location} />
              <Detail label="Phone" value={selected.phone} />
              <Detail label="Joined" value={formatDate(selected.joinedAt)} />
              <Detail
                label="Reports to"
                value={selected.reportsTo ? (byId[selected.reportsTo]?.name ?? '—') : 'Leadership'}
              />
              <Detail label="Leave balance" value={`${selected.leaveBalance} days`} />
              {showPay && (
                <>
                  <Detail label="Monthly CTC" value={formatCurrency(selected.monthlyCtc, 'INR')} />
                  <Detail label="Bank account" value={`•••• ${selected.bankLast4}`} />
                </>
              )}
            </dl>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-text">Direct reports</h3>
              {employees.filter((employee) => employee.reportsTo === selected.id).length === 0 ? (
                <p className="text-sm text-muted">No direct reports.</p>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {employees
                    .filter((employee) => employee.reportsTo === selected.id)
                    .map((employee) => (
                      <li key={employee.id} className="flex items-center gap-2.5 px-3 py-2">
                        <Avatar name={employee.name} size="xs" />
                        <span className="flex min-w-0 flex-col leading-tight">
                          <span className="truncate text-sm text-text">{employee.name}</span>
                          <span className="truncate text-xs text-muted">{employee.title}</span>
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </section>
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

import { useCallback, useMemo } from 'react'
import { Building2, Users } from 'lucide-react'
import { Avatar, Badge, Card, CardBody, EmptyState, Progress, SkeletonCards } from '@/components/ui'
import { KpiCard, KpiGrid, PageHeader } from '@/components/shared'
import { useAsync } from '@/hooks'
import { departmentService, employeeService } from '@/services/hrService'
import { formatCurrency, formatPercent } from '@/utils/format'

/** HR → Departments: the org structure and how headcount is distributed. */
export function DepartmentsPage() {
  const load = useCallback(async () => {
    const [departments, employees] = await Promise.all([
      departmentService.list(),
      employeeService.list(),
    ])
    const byId = Object.fromEntries(employees.map((employee) => [employee.id, employee]))
    return departments
      .map((department) => {
        const members = employees.filter((employee) => employee.departmentId === department.id)
        return {
          ...department,
          head: byId[department.headEmployeeId] ?? null,
          members,
          headcount: members.length,
          monthlyCost: members.reduce((sum, employee) => sum + employee.monthlyCtc, 0),
          contract: members.filter((employee) => employee.employmentType === 'CONTRACT').length,
        }
      })
      .sort((left, right) => right.headcount - left.headcount)
  }, [])

  const { data, loading, error } = useAsync(load)
  const departments = useMemo(() => data ?? [], [data])

  const totals = useMemo(
    () => ({
      departments: departments.length,
      headcount: departments.reduce((sum, department) => sum + department.headcount, 0),
      cost: departments.reduce((sum, department) => sum + department.monthlyCost, 0),
      largest: departments[0]?.name ?? '—',
    }),
    [departments],
  )

  const maxHeadcount = Math.max(1, ...departments.map((department) => department.headcount))

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Departments"
        description="How the team is organised, and who leads each function."
        breadcrumbs={[{ label: 'HR' }, { label: 'Departments' }]}
      />

      <KpiGrid className="mb-5">
        <KpiCard label="Departments" value={totals.departments} icon={Building2} tone="primary" loading={loading} />
        <KpiCard label="Headcount" value={totals.headcount} icon={Users} tone="info" loading={loading} />
        <KpiCard
          label="Monthly cost"
          value={formatCurrency(totals.cost, 'INR', { compact: true })}
          tone="success"
          loading={loading}
        />
        <KpiCard label="Largest function" value={totals.largest} tone="warning" loading={loading} />
      </KpiGrid>

      {loading ? (
        <SkeletonCards count={6} className="sm:grid-cols-2 xl:grid-cols-3" />
      ) : error ? (
        <Card>
          <EmptyState title="Couldn’t load departments" description={error.message} />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {departments.map((department) => (
            <Card key={department.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-text">{department.name}</h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">
                      {department.description}
                    </p>
                  </div>
                  <Badge tone="primary" size="sm">
                    {department.headcount}
                  </Badge>
                </div>

                {department.head && (
                  <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-border bg-surface-2/40 p-2.5">
                    <Avatar name={department.head.name} size="sm" />
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className="truncate text-sm font-medium text-text">
                        {department.head.name}
                      </span>
                      <span className="truncate text-xs text-muted">{department.head.title}</span>
                    </span>
                  </div>
                )}

                <div className="mt-3">
                  <Progress
                    value={(department.headcount / maxHeadcount) * 100}
                    size="sm"
                    label="Share of headcount"
                  />
                  <p className="mt-1.5 text-[11px] text-muted">
                    {formatPercent((department.headcount / totals.headcount) * 100, 0)} of the team ·{' '}
                    {department.contract} on contract ·{' '}
                    {formatCurrency(department.monthlyCost, 'INR', { compact: true })}/month
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {department.members.slice(0, 8).map((member) => (
                    <Avatar key={member.id} name={member.name} size="xs" />
                  ))}
                  {department.members.length > 8 && (
                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-surface-2 text-[10px] font-medium text-muted">
                      +{department.members.length - 8}
                    </span>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

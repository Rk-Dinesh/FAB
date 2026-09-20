import { useCallback, useMemo, useState } from 'react'
import { CalendarCheck, CalendarX, Clock, UserMinus } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Card, CardBody, CardHeader, CardTitle, EmptyState, Select, Skeleton, Tooltip } from '@/components/ui'
import { KpiCard, KpiGrid, PageHeader } from '@/components/shared'
import { useAsync } from '@/hooks'
import { attendanceService, employeeService } from '@/services/hrService'
import { formatDate, formatPercent } from '@/utils/format'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const STATUS_TONES = {
  PRESENT: 'bg-success',
  LATE: 'bg-warning',
  LEAVE: 'bg-info',
  ABSENT: 'bg-danger',
  WEEK_OFF: 'bg-surface-2',
}

/** The last three month keys, computed once so render stays pure. */
const MONTH_OPTIONS = (() => {
  const now = new Date()
  return Array.from({ length: 3 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1))
    return {
      value: date.toISOString().slice(0, 7),
      label: date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    }
  })
})()

/** HR → Attendance: a month calendar, per employee or across the whole team. */
export function AttendancePage() {
  const [month, setMonth] = useState(MONTH_OPTIONS[0].value)
  const [employeeId, setEmployeeId] = useState('')

  const load = useCallback(async () => {
    const [rows, employees] = await Promise.all([attendanceService.list(), employeeService.list()])
    return { rows, employees }
  }, [])
  const { data, loading, error } = useAsync(load)

  const rows = useMemo(
    () =>
      (data?.rows ?? []).filter(
        (row) => row.date.startsWith(month) && (!employeeId || row.employeeId === employeeId),
      ),
    [data, month, employeeId],
  )

  /** Group into calendar days, padded so the grid starts on a Monday. */
  const calendar = useMemo(() => {
    const byDate = new Map()
    for (const row of rows) {
      const entry = byDate.get(row.date) ?? {
        date: row.date,
        PRESENT: 0,
        LATE: 0,
        LEAVE: 0,
        ABSENT: 0,
        WEEK_OFF: 0,
        total: 0,
      }
      entry[row.status] += 1
      entry.total += 1
      byDate.set(row.date, entry)
    }
    const days = [...byDate.values()].sort((left, right) => left.date.localeCompare(right.date))
    if (days.length === 0) return { days: [], leadingBlanks: 0 }
    const firstDay = new Date(`${days[0].date}T00:00:00.000Z`).getUTCDay()
    // getUTCDay: Sunday = 0, so shift to a Monday-first grid.
    return { days, leadingBlanks: (firstDay + 6) % 7 }
  }, [rows])

  const stats = useMemo(() => {
    const total = rows.length
    const present = rows.filter((row) => row.status === 'PRESENT').length
    const late = rows.filter((row) => row.status === 'LATE').length
    return {
      present,
      late,
      absent: rows.filter((row) => row.status === 'ABSENT').length,
      leave: rows.filter((row) => row.status === 'LEAVE').length,
      rate: total > 0 ? ((present + late) / total) * 100 : 0,
    }
  }, [rows])

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Attendance"
        description="Daily attendance across the team, month by month."
        breadcrumbs={[{ label: 'HR' }, { label: 'Attendance' }]}
        actions={
          <div className="flex gap-2">
            <Select
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              options={MONTH_OPTIONS}
              containerClassName="w-44"
              aria-label="Month"
            />
            <Select
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
              placeholder="Whole team"
              options={(data?.employees ?? []).map((employee) => ({
                value: employee.id,
                label: employee.name,
              }))}
              containerClassName="w-52"
              aria-label="Employee"
            />
          </div>
        }
      />

      <KpiGrid className="mb-5">
        <KpiCard
          label="Attendance rate"
          value={formatPercent(stats.rate, 1)}
          icon={CalendarCheck}
          tone={stats.rate >= 95 ? 'success' : 'warning'}
          loading={loading}
        />
        <KpiCard label="Late arrivals" value={stats.late} icon={Clock} tone="warning" loading={loading} />
        <KpiCard label="On leave" value={stats.leave} icon={UserMinus} tone="info" loading={loading} />
        <KpiCard label="Absent" value={stats.absent} icon={CalendarX} tone="danger" loading={loading} />
      </KpiGrid>

      <Card>
        <CardHeader>
          <CardTitle>
            {MONTH_OPTIONS.find((option) => option.value === month)?.label}
            {employeeId && ` · ${data?.employees.find((entry) => entry.id === employeeId)?.name}`}
          </CardTitle>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : error ? (
            <EmptyState title="Couldn’t load attendance" description={error.message} compact />
          ) : calendar.days.length === 0 ? (
            <EmptyState
              title="No attendance recorded"
              description="Attendance is seeded for the trailing 45 days."
              compact
            />
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1.5">
                {WEEKDAYS.map((weekday) => (
                  <div key={weekday} className="pb-1 text-center text-[11px] font-medium text-muted">
                    {weekday}
                  </div>
                ))}

                {Array.from({ length: calendar.leadingBlanks }).map((_, index) => (
                  <div key={`blank-${index}`} />
                ))}

                {calendar.days.map((day) => {
                  const dominant =
                    day.ABSENT > 0 && employeeId
                      ? 'ABSENT'
                      : day.LEAVE > 0 && employeeId
                        ? 'LEAVE'
                        : day.LATE > 0 && employeeId
                          ? 'LATE'
                          : day.WEEK_OFF > day.PRESENT
                            ? 'WEEK_OFF'
                            : 'PRESENT'
                  const rate = day.total > 0 ? ((day.PRESENT + day.LATE) / day.total) * 100 : 0
                  return (
                    <Tooltip
                      key={day.date}
                      content={
                        <span className="block">
                          <span className="font-medium">{formatDate(day.date)}</span>
                          <br />
                          {day.PRESENT} present · {day.LATE} late
                          <br />
                          {day.LEAVE} leave · {day.ABSENT} absent
                        </span>
                      }
                    >
                      <div
                        className={cn(
                          'flex aspect-square w-full flex-col items-center justify-center rounded-md border border-border',
                          'cursor-default transition-colors hover:border-border-strong',
                        )}
                      >
                        <span className="text-xs font-medium text-text">
                          {Number(day.date.slice(-2))}
                        </span>
                        <span
                          className={cn('mt-1 h-1.5 w-6 rounded-full', STATUS_TONES[dominant])}
                          style={employeeId ? undefined : { opacity: Math.max(0.25, rate / 100) }}
                          aria-hidden="true"
                        />
                      </div>
                    </Tooltip>
                  )
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
                {Object.entries(STATUS_TONES).map(([status, tone]) => (
                  <span key={status} className="flex items-center gap-1.5">
                    <span className={cn('h-1.5 w-5 rounded-full', tone)} aria-hidden="true" />
                    {status.replace('_', ' ').toLowerCase()}
                  </span>
                ))}
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

import { createService } from './createService'
import { table } from '@/mocks/db'

export const employeeService = createService('employees', {
  idPrefix: 'EMP',
  searchFields: ['name', 'code', 'title', 'department', 'email', 'location'],
  defaultSort: { by: 'name', dir: 'asc' },
})

export const departmentService = createService('departments', {
  idPrefix: 'DEP',
  searchFields: ['name', 'description'],
  defaultSort: { by: 'name', dir: 'asc' },
})

export const attendanceService = createService('attendance', {
  idPrefix: 'ATT',
  searchFields: ['employeeName', 'department', 'status'],
  defaultSort: { by: 'date', dir: 'desc' },
})

export const leaveService = createService('leaves', {
  idPrefix: 'LVE',
  searchFields: ['employeeName', 'type', 'reason', 'status'],
  defaultSort: { by: 'appliedAt', dir: 'desc' },
})

export const payrollService = createService('payroll', {
  idPrefix: 'PAY',
  searchFields: ['employeeName', 'department', 'payslipNumber'],
  defaultSort: { by: 'employeeName', dir: 'asc' },
})

/**
 * Attendance for one month, shaped for a calendar grid.
 * @param {string} month YYYY-MM
 * @param {string} [employeeId]
 */
export async function getAttendanceMonth(month, employeeId) {
  const rows = await attendanceService.list({
    filters: { ...(employeeId ? { employeeId } : {}) },
  })
  const inMonth = rows.filter((row) => row.date.startsWith(month))
  const byDate = new Map()
  for (const row of inMonth) {
    const entry = byDate.get(row.date) ?? {
      date: row.date,
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
      weekOff: 0,
      rows: [],
    }
    if (row.status === 'PRESENT') entry.present += 1
    if (row.status === 'ABSENT') entry.absent += 1
    if (row.status === 'LATE') entry.late += 1
    if (row.status === 'LEAVE') entry.leave += 1
    if (row.status === 'WEEK_OFF') entry.weekOff += 1
    entry.rows.push(row)
    byDate.set(row.date, entry)
  }
  return [...byDate.values()].sort((left, right) => left.date.localeCompare(right.date))
}

/**
 * @param {string} leaveId
 * @param {'APPROVED'|'REJECTED'} status
 * @param {string} [remarks]
 * @param {string} [decidedById]
 */
export async function decideLeave(leaveId, status, remarks = '', decidedById = 'EMP-042') {
  return leaveService.update(leaveId, {
    status,
    remarks,
    decidedById,
    decidedAt: new Date().toISOString(),
  })
}

/** Headcount by department, for the HR and CXO dashboards. */
export async function getHeadcount() {
  const employees = await employeeService.list()
  const byDepartment = new Map()
  for (const employee of employees) {
    byDepartment.set(employee.department, (byDepartment.get(employee.department) ?? 0) + 1)
  }
  return {
    total: employees.length,
    byDepartment: [...byDepartment.entries()]
      .map(([department, count]) => ({ department, count }))
      .sort((left, right) => right.count - left.count),
    contractCount: employees.filter((employee) => employee.employmentType === 'CONTRACT').length,
  }
}

/** One month's payroll totals. */
export async function getPayrollSummary(month) {
  const rows = table('payroll').filter((row) => (month ? row.month === month : true))
  return {
    month: month ?? rows[0]?.month ?? null,
    employeeCount: rows.length,
    gross: rows.reduce((sum, row) => sum + row.gross, 0),
    deductions: rows.reduce((sum, row) => sum + row.deductions, 0),
    netPay: rows.reduce((sum, row) => sum + row.netPay, 0),
    currency: 'INR',
  }
}

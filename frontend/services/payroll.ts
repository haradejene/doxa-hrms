import api from './api'

export interface EthiopianDate {
  year: number
  month: number
  day: number
  month_name: string
  label: string
}

export interface PayrollEmployer {
  name: string
  program: string
  tin: string
  region: string
  zone: string
  wereda: string
  kebele: string
}

export interface PayrollRecord {
  no: number
  id: number
  employee_id: number
  employee_name: string
  employee_number: string
  position: string
  hire_date: string | null
  /** The span of work this row pays for — the month, or from the hire date if later. */
  period_start: string | null
  period_end: string | null
  payment_date: string | null
  basic_salary: number
  allowances: number
  transport_allowance: number
  non_taxable_allowance: number
  overtime: number
  bonus: number
  gross_pay: number
  taxable_income: number
  income_tax: number
  tax_rate: number
  pension_employee: number
  pension_employer: number
  other_deductions: number
  total_deductions: number
  net_pay: number
  processed_date: string | null
}

export interface PayrollTotals {
  employees: number
  basic_salary: number
  allowances: number
  overtime: number
  bonus: number
  gross_pay: number
  taxable_income: number
  income_tax: number
  pension_employee: number
  pension_employer: number
  other_deductions: number
  total_deductions: number
  net_pay: number
}

export interface PayrollSheet {
  period: string
  period_label: string
  period_start: string
  period_end: string
  ethiopian: { start: EthiopianDate; end: EthiopianDate }
  employer: PayrollEmployer
  currency: { code: string; symbol: string }
  status: 'draft' | 'processed'
  processed_at: string | null
  payment_date: string
  records: PayrollRecord[]
  totals: PayrollTotals
}

export interface PayrollPeriod {
  period: string
  label: string
  ethiopian: EthiopianDate
  status: 'draft' | 'processed'
  processed_at: string | null
  total_net: number | null
}

/** The payroll sheet for a single month ("2026-08"). */
export async function getPayrollSheet(period: string): Promise<PayrollSheet> {
  const { data } = await api.get('/api/payroll', { params: { period } })
  return data
}

/** Months selectable in the switcher, newest first. */
export async function getPayrollPeriods(): Promise<PayrollPeriod[]> {
  const { data } = await api.get('/api/payroll/periods')
  return data
}

/** Run payroll for every employee in the month at once. */
export async function processPayroll(
  period: string,
  force = false
): Promise<{ message: string; processed: number; sheet: PayrollSheet }> {
  const { data } = await api.post('/api/payroll/process', { period, force })
  return data
}

export interface EditPayrollInput {
  allowances: number
  transport_allowance: number
  overtime_pay: number
  bonuses: number
  deductions: number
  notes: string
}

/** Update individual payroll item values. */
export async function updatePayrollItem(
  id: number,
  data: EditPayrollInput
): Promise<{ message: string; item: any; sheet: PayrollSheet }> {
  const { data: res } = await api.put(`/api/payroll/items/${id}`, data)
  return res
}

export interface PayrollSettings {
  employee_rate: number
  employer_rate: number
  transport_ceiling: number
}

/** Fetch active payroll configuration rates. */
export async function getPayrollSettings(): Promise<PayrollSettings> {
  const { data } = await api.get('/api/settings/payroll')
  return data
}

/** Persist updated payroll configuration rates. */
export async function updatePayrollSettings(
  settings: PayrollSettings
): Promise<{ message: string; settings: PayrollSettings }> {
  const { data } = await api.put('/api/settings/payroll', settings)
  return data
}

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Download, Printer, Play, RotateCcw,
  CheckCircle2, Search, X, AlertCircle, Loader2, Users, Wallet, Receipt, Edit2, Check
} from 'lucide-react'
import {
  getPayrollSheet, processPayroll, updatePayrollItem,
  type PayrollSheet, type PayrollRecord, type PayrollTotals
} from '@/services/payroll'

/** Spreadsheet cell figure: 12,345.67, or an em dash when there is nothing to show. */
function num(n: number | null | undefined, dashZero = true) {
  if (n === null || n === undefined) return '—'
  if (dashZero && Math.abs(n) < 0.005) return '—'
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Headline figure with the Birr symbol. */
const birr = (n: number) =>
  'Br ' + (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** yyyy-mm-dd -> 15 Mar 2022 */
function shortDate(d: string | null | undefined) {
  if (!d) return '—'
  const parsed = new Date(d + (d.length === 10 ? 'T00:00:00' : ''))
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * The span of work a row pays for, e.g. "01 – 31 Aug 2026". Collapses to a single
 * month/year when both ends fall in the same month, which is the normal case.
 */
function payPeriod(from: string | null, to: string | null) {
  if (!from || !to) return '—'
  const a = new Date(from + 'T00:00:00')
  const b = new Date(to + 'T00:00:00')
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return '—'

  const sameMonth = a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
  const day = (d: Date) => String(d.getDate()).padStart(2, '0')

  return sameMonth
    ? `${day(a)} – ${day(b)} ${b.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`
    : `${shortDate(from)} – ${shortDate(to)}`
}

/** Sum the rows that are actually on screen, so the TOTAL line always adds up. */
function sumRows(rows: PayrollRecord[]): PayrollTotals {
  const add = (pick: (r: PayrollRecord) => number) =>
    Math.round(rows.reduce((s, r) => s + (pick(r) || 0), 0) * 100) / 100

  return {
    employees: rows.length,
    basic_salary: add(r => r.basic_salary),
    allowances: add(r => r.allowances),
    overtime: add(r => r.overtime),
    bonus: add(r => r.bonus),
    gross_pay: add(r => r.gross_pay),
    taxable_income: add(r => r.taxable_income),
    income_tax: add(r => r.income_tax),
    pension_employee: add(r => r.pension_employee),
    pension_employer: add(r => r.pension_employer),
    other_deductions: add(r => r.other_deductions),
    total_deductions: add(r => r.total_deductions),
    net_pay: add(r => r.net_pay),
  }
}

/** Column layout of the declaration sheet, shared by the table and the CSV export. */
const COLUMNS: {
  key: string
  label: string
  sub?: string
  align: 'left' | 'right' | 'center'
  value: (r: PayrollRecord) => string
  total?: (t: PayrollTotals) => string
  width?: string
}[] = [
  { key: 'no', label: 'No.', align: 'center', value: r => String(r.no), width: 'w-10' },
  { key: 'employee_name', label: 'Employee Name', align: 'left', value: r => r.employee_name },
  { key: 'pay_period', label: 'Pay Period', align: 'center', value: r => payPeriod(r.period_start, r.period_end) },
  { key: 'payment_date', label: 'Payment Date', align: 'center', value: r => shortDate(r.payment_date) },
  { key: 'basic_salary', label: 'Basic Salary', align: 'right', value: r => num(r.basic_salary, false), total: t => num(t.basic_salary, false) },
  { key: 'allowances', label: 'Allowance', align: 'right', value: r => num(r.allowances), total: t => num(t.allowances) },
  { key: 'transport_allowance', label: 'Transport', align: 'right', value: r => num(r.transport_allowance) },
  { key: 'overtime', label: 'Overtime', align: 'right', value: r => num(r.overtime), total: t => num(t.overtime) },
  { key: 'bonus', label: 'Bonus', align: 'right', value: r => num(r.bonus), total: t => num(t.bonus) },
  { key: 'gross_pay', label: 'Gross Earning', align: 'right', value: r => num(r.gross_pay, false), total: t => num(t.gross_pay, false) },
  { key: 'other_deductions', label: 'Other Ded.', align: 'right', value: r => num(r.other_deductions), total: t => num(t.other_deductions) },
  { key: 'non_taxable_allowance', label: 'Non-Taxable', align: 'right', value: r => num(r.non_taxable_allowance) },
  { key: 'taxable_income', label: 'Taxable Income', align: 'right', value: r => num(r.taxable_income, false), total: t => num(t.taxable_income, false) },
  { key: 'income_tax', label: 'Income Tax', sub: 'Sch. A', align: 'right', value: r => num(r.income_tax), total: t => num(t.income_tax, false) },
  { key: 'tax_rate', label: 'Rate', align: 'center', value: r => `${r.tax_rate}%` },
  { key: 'pension_employee', label: 'Pension', sub: '7%', align: 'right', value: r => num(r.pension_employee), total: t => num(t.pension_employee, false) },
  { key: 'pension_employer', label: 'Employer Tax', sub: '11%', align: 'right', value: r => num(r.pension_employer), total: t => num(t.pension_employer, false) },
  { key: 'total_deductions', label: 'Total Ded.', align: 'right', value: r => num(r.total_deductions, false), total: t => num(t.total_deductions, false) },
  { key: 'net_pay', label: 'Net Pay', align: 'right', value: r => num(r.net_pay, false), total: t => num(t.net_pay, false) },
  { key: 'processed_date', label: 'Processed', align: 'center', value: r => shortDate(r.processed_date) },
  { key: 'signature', label: 'Signature', align: 'center', value: () => '' },
  { key: 'action', label: 'Action', align: 'center', value: () => '', width: 'w-16 print:hidden' },
]

export default function PayrollDetailPage({ params }: { params: { id: string } }) {
  const period = params.id
  const [sheet, setSheet] = useState<PayrollSheet | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [search, setSearch] = useState('')
  const [banner, setBanner] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  // Edit states
  const [editingItem, setEditingItem] = useState<PayrollRecord | null>(null)
  const [editAllowance, setEditAllowance] = useState('')
  const [editTransport, setEditTransport] = useState('')
  const [editOvertime, setEditOvertime] = useState('')
  const [editBonus, setEditBonus] = useState('')
  const [editDeductions, setEditDeductions] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [savingItem, setSavingItem] = useState(false)
  const [editError, setEditError] = useState('')

  const loadSheet = useCallback(async (key: string) => {
    setLoading(true)
    try {
      setSheet(await getPayrollSheet(key))
    } catch {
      setSheet(null)
      setBanner({ kind: 'error', text: 'Could not load the payroll sheet for this month.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSheet(period)
  }, [period, loadSheet])

  const handleRun = async () => {
    if (!sheet) return
    const rerun = sheet.status === 'processed'
    const question = rerun
      ? `Re-run payroll for ${sheet.period_label}? The figures recorded on ${shortDate(sheet.processed_at)} will be replaced.`
      : `Run payroll for all ${sheet.totals.employees} employees for ${sheet.period_label}?`
    if (!window.confirm(question)) return

    setProcessing(true)
    setBanner(null)
    try {
      const res = await processPayroll(period, rerun)
      setSheet(res.sheet)
      setBanner({ kind: 'ok', text: res.message })
    } catch (e: any) {
      setBanner({ kind: 'error', text: e?.response?.data?.message ?? 'Failed to process payroll.' })
    } finally {
      setProcessing(false)
    }
  }

  const handleEditClick = (item: PayrollRecord) => {
    setEditingItem(item)
    setEditAllowance(String(item.allowances || 0))
    setEditTransport(String(item.transport_allowance || 0))
    setEditOvertime(String(item.overtime || 0))
    setEditBonus(String(item.bonus || 0))
    setEditDeductions(String((item as any).other_deductions || 0))
    setEditNotes((item as any).deduction_notes || '')
    setEditError('')
  }

  const handleSaveItem = async () => {
    if (!editingItem) return
    setSavingItem(true)
    setEditError('')
    try {
      const res = await updatePayrollItem(editingItem.id, {
        allowances: parseFloat(editAllowance) || 0,
        transport_allowance: parseFloat(editTransport) || 0,
        overtime_pay: parseFloat(editOvertime) || 0,
        bonuses: parseFloat(editBonus) || 0,
        deductions: parseFloat(editDeductions) || 0,
        notes: editNotes,
      })
      setSheet(res.sheet)
      setBanner({ kind: 'ok', text: 'Payroll record updated successfully.' })
      setEditingItem(null)
    } catch (e: any) {
      setEditError(e?.response?.data?.message ?? 'Failed to update payroll record.')
    } finally {
      setSavingItem(false)
    }
  }

  const rows = useMemo(() => {
    if (!sheet) return []
    const q = search.trim().toLowerCase()
    if (!q) return sheet.records
    return sheet.records.filter(r =>
      r.employee_name.toLowerCase().includes(q) ||
      (r.employee_number ?? '').toLowerCase().includes(q) ||
      (r.position ?? '').toLowerCase().includes(q)
    )
  }, [sheet, search])

  // Everything on the page — tiles, TOTAL line, footer — sums the same rows.
  const totals = useMemo(() => sumRows(rows), [rows])

  const exportCsv = () => {
    if (!sheet) return
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`

    // Money cells go out as bare numbers so a spreadsheet reads them as numbers,
    // not text. Everything else is quoted.
    const cell = (formatted: string) => {
      const v = formatted.replace(/—/g, '').trim()
      if (!v) return ''
      return /^-?[\d,]+\.\d{2}$/.test(v) ? v.replace(/,/g, '') : esc(v)
    }

    const emp = sheet.employer
    const exportColumns = COLUMNS.filter(c => c.key !== 'action')

    const lines = [
      [esc('Employment Income Tax Declaration'), esc(`For the Month ${sheet.ethiopian.end.label}`)].join(','),
      [esc('Employer Name'), esc(emp.name), esc(emp.program)].join(','),
      [esc('Employer Address'), esc(`Region ${emp.region}`), esc(`Zone ${emp.zone}`), esc(`Wereda ${emp.wereda}`), esc(`Kebele ${emp.kebele}`), esc(`TIN ${emp.tin}`)].join(','),
      [esc('Pay Period Start'), esc(sheet.period_start), esc('Pay Period End'), esc(sheet.period_end), esc('Payment Date'), esc(sheet.payment_date), esc('Currency'), esc(sheet.currency.code)].join(','),
      '',
      exportColumns.map(c => esc(c.sub ? `${c.label} ${c.sub}` : c.label)).join(','),
      ...rows.map(r => exportColumns.map(c => cell(c.value(r))).join(',')),
      exportColumns.map(c => (c.key === 'no' ? esc('TOTAL') : c.total ? cell(c.total(totals)) : '')).join(','),
    ]
    const url = URL.createObjectURL(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `payroll-${sheet.period}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const emp = sheet?.employer
  const addressIncomplete = !!emp && !(emp.region && emp.zone && emp.wereda && emp.kebele && emp.tin)

  return (
    <div className="space-y-5">
      {/* Back to Periods */}
      <div data-no-print className="flex items-center gap-3">
        <Link
          href="/payroll"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-violet-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Periods
        </Link>
      </div>

      {/* Banner ------------------------------------------------------------ */}
      {banner && (
        <div
          data-no-print
          className={`flex items-center gap-3 rounded-xl border px-5 py-3.5 ${
            banner.kind === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {banner.kind === 'ok'
            ? <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
            : <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />}
          <p className="text-sm font-medium">{banner.text}</p>
          <button onClick={() => setBanner(null)} className="ml-auto opacity-50 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header and filters ----------------------------------------------- */}
      <div data-no-print className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
        {/* Top row: Search & Actions */}
        <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
          {/* Header Title */}
          <div className="mr-auto">
            <h2 className="text-xl font-bold text-gray-900">
              {sheet ? `${sheet.period_label} Payroll` : 'Loading Payroll...'}
            </h2>
            {sheet && (
              <p className="text-xs text-gray-400 mt-0.5">
                {sheet.ethiopian.end.month_name} {sheet.ethiopian.end.year} E.C · {sheet.status === 'processed' ? 'Processed' : 'Draft'}
              </p>
            )}
          </div>

          {/* Search */}
          <div className="w-full md:w-80 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search name, ID, position…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full md:w-auto justify-end">
            <button
              onClick={exportCsv}
              disabled={!sheet}
              className="inline-flex items-center gap-2 h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all"
            >
              <Download className="h-4 w-4 text-gray-500" /> CSV
            </button>
            <button
              onClick={() => window.print()}
              disabled={!sheet}
              className="inline-flex items-center gap-2 h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all"
            >
              <Printer className="h-4 w-4 text-gray-500" /> Print
            </button>
            <button
              onClick={handleRun}
              disabled={processing || !sheet || sheet.totals.employees === 0}
              className="inline-flex items-center gap-2 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 text-sm font-semibold text-white shadow-md shadow-purple-500/20 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {processing
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : sheet?.status === 'processed' ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {sheet?.status === 'processed' ? 'Re-run Payroll' : 'Run Payroll'}
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center min-h-[320px]">
          <div className="w-10 h-10 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      )}

      {!loading && sheet && (
        <>
          {/* Summary ------------------------------------------------------- */}
          <div data-no-print className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-2xl p-5 bg-gradient-to-br from-violet-600 to-purple-700 text-white relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
              <Wallet className="h-5 w-5 text-white/60 mb-2" />
              <p className="text-2xl font-black tabular-nums">{birr(totals.net_pay)}</p>
              <p className="text-xs text-white/70 mt-0.5">Total Net Pay · {sheet.period_label}</p>
            </div>

            {[
              { icon: Receipt, tint: 'text-rose-500 bg-rose-50', label: 'Employment Income Tax', value: birr(totals.income_tax), note: 'Schedule A — withheld' },
              { icon: Receipt, tint: 'text-blue-500 bg-blue-50', label: 'Pension Contribution', value: birr(totals.pension_employee + totals.pension_employer), note: `Employee 7% · Employer 11%` },
              { icon: Users, tint: 'text-emerald-500 bg-emerald-50', label: 'Employees on Payroll', value: String(totals.employees), note: `Gross ${birr(totals.gross_pay)}` },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl grid place-items-center flex-shrink-0 ${card.tint}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">{card.label}</p>
                  <p className="text-xl font-black text-gray-900 tabular-nums truncate">{card.value}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{card.note}</p>
                </div>
              </div>
            ))}
          </div>

          {/* The sheet ----------------------------------------------------- */}
          <div className="print-sheet bg-white rounded-2xl border border-gray-200 overflow-hidden">

            {/* Declaration header */}
            <div className="border-b-2 border-gray-800 px-5 py-4 text-gray-900">
              <div className="flex flex-wrap items-baseline gap-x-8 gap-y-1">
                <h1 className="text-[15px] font-bold tracking-tight">Employment Income Tax Declaration</h1>
                <p className="text-[13px] font-semibold">
                  <span className="font-normal text-gray-500 mr-2">For the Month</span>
                  {sheet.ethiopian.end.month_name} {sheet.ethiopian.end.day} / {sheet.ethiopian.end.year} E.C
                  <span className="ml-2 font-normal text-gray-400">({sheet.period_label})</span>
                </p>
              </div>

              <div className="mt-1.5 flex flex-wrap items-baseline gap-x-8 gap-y-1 text-[13px]">
                <p>
                  <span className="text-gray-500 mr-2">Employer Name</span>
                  <span className="font-semibold">{emp?.name}</span>
                </p>
                {emp?.program && <p className="font-semibold">{emp.program}</p>}
                {emp?.tin && (
                  <p><span className="text-gray-500 mr-2">TIN</span><span className="font-semibold">{emp.tin}</span></p>
                )}
              </div>

              <div className="mt-1.5 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-[13px]">
                <span className="text-gray-500">Employer Address</span>
                {[
                  ['Region', emp?.region],
                  ['Zone', emp?.zone],
                  ['Wereda', emp?.wereda],
                  ['Kebele', emp?.kebele],
                ].map(([label, value]) => (
                  <p key={label}>
                    <span className="text-gray-500 mr-1.5">{label}</span>
                    <span className="font-semibold">{value || '—'}</span>
                  </p>
                ))}
              </div>

              {/* Pay period — the span of work this sheet pays for. */}
              <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-[13px]">
                <p>
                  <span className="text-gray-500 mr-2">Pay Period</span>
                  <span className="font-semibold">{shortDate(sheet.period_start)} – {shortDate(sheet.period_end)}</span>
                </p>
                <p>
                  <span className="text-gray-500 mr-2">Payment Date</span>
                  <span className="font-semibold">{shortDate(sheet.payment_date)}</span>
                </p>
                <p>
                  <span className="text-gray-500 mr-2">Payroll Processed</span>
                  <span className="font-semibold">{sheet.processed_at ? shortDate(sheet.processed_at) : 'Not yet processed'}</span>
                </p>
                <p className="text-gray-500">All amounts in Birr ({sheet.currency.code})</p>
              </div>

              {addressIncomplete && (
                <p data-no-print className="mt-2 text-[11px] text-amber-600">
                  Employer address is incomplete — set PAYROLL_EMPLOYER_REGION, _ZONE, _WEREDA, _KEBELE and _TIN in the backend .env before filing.
                </p>
              )}
            </div>

            {/* Grid */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-gray-100">
                    {COLUMNS.map(c => {
                      // Hide Action column on print
                      if (c.key === 'action') {
                        return (
                          <th
                            key={c.key}
                            className="border border-gray-300 px-2 py-2 font-bold text-gray-700 uppercase tracking-wide text-[10px] whitespace-nowrap text-center w-16 print:hidden"
                          >
                            {c.label}
                          </th>
                        )
                      }
                      return (
                        <th
                          key={c.key}
                          className={`border border-gray-300 px-2 py-2 font-bold text-gray-700 uppercase tracking-wide text-[10px] whitespace-nowrap ${
                            c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'
                          } ${c.width ?? ''}`}
                        >
                          {c.label}
                          {c.sub && <span className="block font-medium normal-case text-[9px] text-gray-400">{c.sub}</span>}
                        </th>
                      )
                    })}
                  </tr>
                </thead>

                <tbody>
                  {rows.map(r => (
                    <tr key={r.id} className="even:bg-gray-50/60 hover:bg-violet-50/50 transition-colors">
                      {COLUMNS.map(c => {
                        if (c.key === 'action') {
                          return (
                            <td key={c.key} className="border border-gray-200 px-2 py-1.5 whitespace-nowrap text-center print:hidden">
                              {sheet.status === 'processed' ? (
                                <button
                                  onClick={() => handleEditClick(r)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                                  title="Edit Employee Payroll"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-gray-300 italic" title="Run payroll to enable editing">
                                  —
                                </span>
                              )}
                            </td>
                          )
                        }

                        return (
                          <td
                            key={c.key}
                            className={`border border-gray-200 px-2 py-1.5 whitespace-nowrap ${
                              c.align === 'right' ? 'text-right tabular-nums' : c.align === 'center' ? 'text-center' : 'text-left'
                            } ${c.key === 'employee_name' ? 'font-semibold text-gray-900' : 'text-gray-700'}
                              ${c.key === 'net_pay' ? 'font-bold text-gray-900 bg-emerald-50/60' : ''}
                              ${c.key === 'income_tax' ? 'text-rose-600' : ''}
                              ${c.key === 'signature' ? 'min-w-[5.5rem]' : ''}`}
                          >
                            {c.key === 'other_deductions' && (r as any).deduction_notes ? (
                              <div>
                                <span>{c.value(r)}</span>
                                <span className="block text-[10px] text-orange-500 font-normal truncate max-w-[7rem]" title={(r as any).deduction_notes}>
                                  {(r as any).deduction_notes}
                                </span>
                              </div>
                            ) : c.value(r)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>

                {rows.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-800 text-white font-bold">
                      {COLUMNS.map(c => {
                        if (c.key === 'action') {
                          return (
                            <td key={c.key} className="border border-gray-700 px-2 py-2 print:hidden"></td>
                          )
                        }
                        return (
                          <td
                            key={c.key}
                            className={`border border-gray-700 px-2 py-2 whitespace-nowrap ${
                              c.align === 'right' ? 'text-right tabular-nums' : 'text-center'
                            }`}
                          >
                            {c.key === 'no' ? 'TOTAL' : c.key === 'employee_name' ? `${rows.length} employees` : c.total ? c.total(totals) : ''}
                          </td>
                        )
                      })}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {rows.length === 0 && (
              <div className="py-16 text-center">
                <div className="w-14 h-14 bg-gray-50 rounded-full grid place-items-center mx-auto mb-3">
                  <AlertCircle className="h-7 w-7 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-600">
                  {search ? 'No employee matches your search' : `No payable employees for ${sheet.period_label}`}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {search ? 'Try a different name or ID.' : 'Employees hired after this month are not included.'}
                </p>
              </div>
            )}

            {/* Declaration footer */}
            {rows.length > 0 && (
              <div className="border-t-2 border-gray-800 px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-6 text-[12px] text-gray-600">
                <div>
                  <p className="text-gray-400">Total tax withheld (Schedule A)</p>
                  <p className="text-base font-bold text-gray-900 tabular-nums">{birr(totals.income_tax)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Pension payable to the authority</p>
                  <p className="text-base font-bold text-gray-900 tabular-nums">
                    {birr(totals.pension_employee + totals.pension_employer)}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Employee {num(totals.pension_employee, false)} · Employer {num(totals.pension_employer, false)}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-gray-400">Prepared by / Signature</p>
                  <div className="mt-6 border-b border-gray-400 sm:ml-auto sm:w-52" />
                </div>
              </div>
            )}
          </div>

          {search && (
            <p data-no-print className="text-xs text-gray-400 text-center mt-2">
              Showing {rows.length} of {sheet.records.length} rows — totals reflect the filtered rows.
            </p>
          )}
        </>
      )}

      {/* Edit Payroll Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Edit Payroll</h3>
                <p className="text-xs text-gray-400 mt-0.5">{editingItem.employee_name}</p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-medium text-red-700">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p>{editError}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Allowance</label>
                  <input
                    type="number" min="0" step="0.01" value={editAllowance}
                    onChange={e => setEditAllowance(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:bg-white focus:border-violet-400 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Transport</label>
                  <input
                    type="number" min="0" step="0.01" value={editTransport}
                    onChange={e => setEditTransport(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:bg-white focus:border-violet-400 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Overtime</label>
                  <input
                    type="number" min="0" step="0.01" value={editOvertime}
                    onChange={e => setEditOvertime(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:bg-white focus:border-violet-400 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bonus</label>
                  <input
                    type="number" min="0" step="0.01" value={editBonus}
                    onChange={e => setEditBonus(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:bg-white focus:border-violet-400 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Other Deductions</label>
                  <input
                    type="number" min="0" step="0.01" value={editDeductions}
                    onChange={e => setEditDeductions(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:bg-white focus:border-violet-400 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Reason for Deduction
                    <span className="ml-1 text-gray-300 font-normal normal-case">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    placeholder="e.g. Loan repayment, late penalty…"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:bg-white focus:border-violet-400 outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setEditingItem(null)}
                className="flex-1 h-10 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                disabled={savingItem}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-sm font-semibold text-white shadow-md shadow-purple-500/20 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 transition-all"
              >
                {savingItem ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DollarSign, Download, Play, CheckCircle2, Clock,
  Search, Filter, ChevronDown, X, Loader2, AlertCircle,
} from 'lucide-react'
import api from '@/services/api'

interface PayrollRecord {
  id: number
  employee_name: string
  employee_number: string
  department: string
  position: string
  period: string
  salary: number
  gross: number
  tax: number
  bonus: number
  amount: number           // net pay
  status: 'processed' | 'pending'
}

const avatarGrads = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
]

function fmt(n: number) {
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function PayrollPage() {
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'processed' | 'pending'>('all')
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const [runResult, setRunResult] = useState<{ message: string; processed: number } | null>(null)

  const fetchPayroll = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/payroll')
      setRecords(res.data)
    } catch {
      console.error('Failed to fetch payroll')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPayroll() }, [fetchPayroll])

  const handleRunPayroll = async () => {
    if (!window.confirm('Are you sure you want to process payroll for all pending employees?')) return
    try {
      setProcessing(true)
      const res = await api.post('/api/payroll/process')
      setRunResult({ message: res.data.message, processed: res.data.processed })
      // refresh
      await fetchPayroll()
    } catch {
      alert('Failed to process payroll.')
    } finally {
      setProcessing(false)
    }
  }

  const visible = records.filter((r) => {
    const matchSearch =
      r.employee_name.toLowerCase().includes(search.toLowerCase()) ||
      r.department.toLowerCase().includes(search.toLowerCase()) ||
      r.employee_number.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || r.status === filterStatus
    return matchSearch && matchStatus
  })

  const totalNet       = records.reduce((s, r) => s + r.amount, 0)
  const totalProcessed = records.filter(r => r.status === 'processed').reduce((s, r) => s + r.amount, 0)
  const totalPending   = records.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0)
  const pendingCount   = records.filter(r => r.status === 'pending').length

  if (loading) return (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="w-10 h-10 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Success banner */}
      {runResult && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3.5">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          <p className="text-sm text-emerald-800 font-medium">{runResult.message} — {runResult.processed} employees processed.</p>
          <button onClick={() => setRunResult(null)} className="ml-auto text-emerald-400 hover:text-emerald-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-violet-600 to-purple-700 text-white relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
          <DollarSign className="h-5 w-5 text-white/60 mb-2" />
          <p className="text-3xl font-black">{fmt(totalNet)}</p>
          <p className="text-sm text-white/70 mt-0.5">Total Net Payroll · {records[0]?.period ?? '—'}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Processed</p>
            <p className="text-2xl font-black text-gray-900">{fmt(totalProcessed)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
            <Clock className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Pending</p>
            <p className="text-2xl font-black text-gray-900">{fmt(totalPending)}</p>
            <p className="text-[11px] text-gray-400">{pendingCount} employees</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search employee, department, ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(['all', 'processed', 'pending'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filterStatus === s ? 'bg-white shadow text-violet-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">
          <Download className="h-4 w-4 text-gray-500" />
          Export CSV
        </button>

        <button
          onClick={handleRunPayroll}
          disabled={processing || pendingCount === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-500/20 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run Payroll {pendingCount > 0 ? `(${pendingCount})` : ''}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-stone-50 border-b border-gray-100">
              <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Department</th>
              <th className="text-right px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Gross</th>
              <th className="text-right px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Tax</th>
              <th className="text-right px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Net Pay</th>
              <th className="text-center px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-right px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Payslip</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visible.map((r, i) => (
              <>
                <tr
                  key={r.id}
                  className="hover:bg-violet-50/20 transition-colors cursor-pointer"
                  onClick={() => setExpandedRow(expandedRow === r.id ? null : r.id)}
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarGrads[i % avatarGrads.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {r.employee_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{r.employee_name}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{r.employee_number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-500 hidden md:table-cell">
                    <div>
                      <p className="font-medium text-gray-700">{r.department}</p>
                      <p className="text-xs text-gray-400">{r.position}</p>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm text-gray-600 hidden lg:table-cell">{fmt(r.gross)}</td>
                  <td className="px-6 py-3.5 text-right text-sm text-red-500 hidden lg:table-cell">-{fmt(r.tax)}</td>
                  <td className="px-6 py-3.5 text-right">
                    <span className="text-sm font-bold text-gray-900">{fmt(r.amount)}</span>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      r.status === 'processed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {r.status === 'processed' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation() }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      PDF
                    </button>
                  </td>
                </tr>
                {/* Expanded breakdown row */}
                {expandedRow === r.id && (
                  <tr key={`${r.id}-detail`} className="bg-violet-50/30">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        {[
                          { label: 'Annual Salary', value: fmt(r.salary) },
                          { label: 'Monthly Gross', value: fmt(r.gross) },
                          { label: 'Tax (22%)', value: fmt(r.tax) },
                          { label: 'Bonus', value: r.bonus > 0 ? fmt(r.bonus) : '—' },
                        ].map(item => (
                          <div key={item.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                            <p className="text-gray-400 font-medium">{item.label}</p>
                            <p className="text-gray-900 font-bold text-sm mt-0.5">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>

        {visible.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-600">No payroll records found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Footer totals */}
        {visible.length > 0 && (
          <div className="px-6 py-3.5 bg-stone-50 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">{visible.length} of {records.length} employees</p>
            <p className="text-sm font-bold text-gray-900">
              Total: {fmt(visible.reduce((s, r) => s + r.amount, 0))}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
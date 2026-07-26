'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Download, Play, CheckCircle2, Clock } from 'lucide-react'
import api from '@/services/api'

interface PayrollRecord {
  id: number
  employee_name: string
  period: string
  amount: number
  status: 'processed' | 'pending'
}

export default function PayrollPage() {
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/payroll').then(r => setRecords(r.data)).finally(() => setLoading(false))
  }, [])

  const totalProcessed = records.filter(r => r.status === 'processed').reduce((s, r) => s + r.amount, 0)
  const totalPending = records.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0)

  if (loading) return (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="w-10 h-10 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-violet-600 to-purple-700 text-white relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
          <p className="text-sm font-medium text-white/70 mb-1">Total Payroll</p>
          <p className="text-3xl font-bold">${(totalProcessed + totalPending).toLocaleString()}</p>
          <p className="text-xs text-white/60 mt-1">This period</p>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Processed</p>
            <p className="text-xl font-bold text-gray-900">${totalProcessed.toLocaleString()}</p>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
            <Clock className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Pending</p>
            <p className="text-xl font-bold text-gray-900">${totalPending.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Payroll Records</h3>
          <div className="flex gap-2">
            <button className="btn-secondary text-xs py-1.5 px-3">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
            <button className="btn-primary text-xs py-1.5 px-3">
              <Play className="h-3.5 w-3.5" /> Run Payroll
            </button>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Period</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payslip</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-violet-50/20 transition-colors">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                      {r.employee_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{r.employee_name}</span>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-sm text-gray-500 font-mono">{r.period}</td>
                <td className="px-6 py-3.5 text-sm font-bold text-gray-900">
                  ${r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                    r.status === 'processed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {r.status === 'processed' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {r.status}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right">
                  <button className="text-violet-600 hover:text-violet-800 text-xs font-semibold flex items-center gap-1 ml-auto transition-colors">
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
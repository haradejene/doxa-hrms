'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Clock, Download } from 'lucide-react'
import api from '@/services/api'

interface AttendanceRecord {
  id: number
  employee_name: string
  date: string
  status: 'present' | 'late' | 'absent'
  check_in: string | null
  check_out: string | null
}

const statusConfig = {
  present: { icon: CheckCircle2, label: 'Present', class: 'bg-emerald-50 text-emerald-700 border-emerald-100', iconClass: 'text-emerald-500' },
  late: { icon: Clock, label: 'Late', class: 'bg-amber-50 text-amber-700 border-amber-100', iconClass: 'text-amber-500' },
  absent: { icon: XCircle, label: 'Absent', class: 'bg-red-50 text-red-700 border-red-100', iconClass: 'text-red-500' },
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/attendance').then(r => setRecords(r.data)).finally(() => setLoading(false))
  }, [])

  const present = records.filter(r => r.status === 'present').length
  const late = records.filter(r => r.status === 'late').length
  const absent = records.filter(r => r.status === 'absent').length

  if (loading) return (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="w-10 h-10 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Present', value: present, bg: 'bg-emerald-500', text: 'text-emerald-600', icon: CheckCircle2 },
          { label: 'Late', value: late, bg: 'bg-amber-500', text: 'text-amber-600', icon: Clock },
          { label: 'Absent', value: absent, bg: 'bg-red-500', text: 'text-red-600', icon: XCircle },
        ].map(s => (
          <div key={s.label} className="card p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
              <s.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Today's Attendance Log</h3>
          <button className="btn-secondary text-xs py-1.5 px-3">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Check In</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Check Out</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {records.map((record) => {
              const sc = statusConfig[record.status]
              const Icon = sc.icon
              return (
                <tr key={record.id} className="hover:bg-violet-50/20 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        {record.employee_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{record.employee_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-500">{record.date}</td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${sc.class}`}>
                      <Icon className={`h-3.5 w-3.5 ${sc.iconClass}`} />
                      {sc.label}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-sm font-mono text-gray-600">{record.check_in ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-6 py-3.5 text-sm font-mono text-gray-600">{record.check_out ?? <span className="text-gray-300">—</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
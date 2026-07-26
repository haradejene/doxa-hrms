'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Clock, Download, Plus, X, Loader2 } from 'lucide-react'
import api from '@/services/api'

interface AttendanceRecord {
  id: number
  employee_name: string
  date: string
  status: 'present' | 'late' | 'absent' | 'half_day' | 'holiday' | 'leave'
  check_in: string | null
  check_out: string | null
}

interface Employee {
  id: number
  first_name: string
  last_name: string
}

const statusConfig: Record<string, any> = {
  present: { icon: CheckCircle2, label: 'Present', class: 'bg-emerald-50 text-emerald-700 border-emerald-100', iconClass: 'text-emerald-500' },
  late: { icon: Clock, label: 'Late', class: 'bg-amber-50 text-amber-700 border-amber-100', iconClass: 'text-amber-500' },
  absent: { icon: XCircle, label: 'Absent', class: 'bg-red-50 text-red-700 border-red-100', iconClass: 'text-red-500' },
  half_day: { icon: Clock, label: 'Half Day', class: 'bg-blue-50 text-blue-700 border-blue-100', iconClass: 'text-blue-500' },
  holiday: { icon: CheckCircle2, label: 'Holiday', class: 'bg-purple-50 text-purple-700 border-purple-100', iconClass: 'text-purple-500' },
  leave: { icon: Clock, label: 'On Leave', class: 'bg-gray-50 text-gray-700 border-gray-100', iconClass: 'text-gray-500' },
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    check_in: '09:00',
    check_out: '17:00'
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const [attRes, empRes] = await Promise.all([
        api.get('/api/attendance'),
        api.get('/api/employees')
      ])
      setRecords(attRes.data)
      setEmployees(empRes.data.data || empRes.data)
    } catch (err) {
      console.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      await api.post('/api/attendance', form)
      setShowModal(false)
      fetchData()
    } catch (err) {
      alert('Failed to log attendance')
    } finally {
      setSubmitting(false)
    }
  }

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
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">Manage employee daily attendance</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-violet-600 transition-colors"
        >
          <Plus className="h-4 w-4" /> Log Attendance
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Present', value: present, bg: 'bg-emerald-500', icon: CheckCircle2 },
          { label: 'Late', value: late, bg: 'bg-amber-500', icon: Clock },
          { label: 'Absent', value: absent, bg: 'bg-red-500', icon: XCircle },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center shadow-lg ${s.bg.replace('500', '500/30')}`}>
              <s.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Today's Attendance Log</h3>
          <button className="inline-flex items-center gap-1.5 text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
        
        {records.length === 0 ? (
          <div className="py-12 text-center">
            <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900">No attendance records today</p>
            <p className="text-xs text-gray-500 mt-1">Click log attendance to add one</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-stone-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Check Out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map((record) => {
                const sc = statusConfig[record.status] || statusConfig.present
                const Icon = sc.icon
                return (
                  <tr key={record.id} className="hover:bg-violet-50/20 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {record.employee_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-gray-900">{record.employee_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-sm font-medium text-gray-500">{record.date}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${sc.class}`}>
                        <Icon className={`h-3 w-3 ${sc.iconClass}`} />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm font-mono font-medium text-gray-600">{record.check_in ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-6 py-3.5 text-sm font-mono font-medium text-gray-600">{record.check_out ?? <span className="text-gray-300">—</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900">Log Attendance</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Employee</label>
                <select
                  required
                  value={form.employee_id}
                  onChange={e => setForm({ ...form, employee_id: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                >
                  <option value="">Select an employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Date</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Check In</label>
                  <input
                    type="time"
                    value={form.check_in}
                    onChange={e => setForm({ ...form, check_in: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Check Out</label>
                  <input
                    type="time"
                    value={form.check_out}
                    onChange={e => setForm({ ...form, check_out: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Status</label>
                <select
                  required
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                >
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                  <option value="half_day">Half Day</option>
                  <option value="holiday">Holiday</option>
                  <option value="leave">On Leave</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !form.employee_id}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-violet-600 disabled:opacity-50 flex items-center justify-center transition-colors"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Clock, Download, Save, Users, MessageCircle, AlertCircle, FileText, Check, X } from 'lucide-react'
import api from '@/services/api'

interface AttendanceRecord {
  id: number
  employee_id?: number
  employee_name: string
  date: string
  status: 'present' | 'late' | 'absent' | 'half_day' | 'holiday' | 'leave' | 'excused_absence'
  absence_reason?: string | null
  absence_note?: string | null
  check_in: string | null
  check_out: string | null
}

interface Employee {
  id: number
  first_name: string
  last_name: string
  department?: { name: string }
}

const statusConfig: Record<string, any> = {
  present: { icon: CheckCircle2, label: 'Present', class: 'bg-emerald-50 text-emerald-700 border-emerald-100', iconClass: 'text-emerald-500' },
  late: { icon: Clock, label: 'Late', class: 'bg-amber-50 text-amber-700 border-amber-100', iconClass: 'text-amber-500' },
  absent: { icon: XCircle, label: 'Absent', class: 'bg-red-50 text-red-700 border-red-100', iconClass: 'text-red-500' },
  half_day: { icon: Clock, label: 'Half Day', class: 'bg-blue-50 text-blue-700 border-blue-100', iconClass: 'text-blue-500' },
  holiday: { icon: CheckCircle2, label: 'Holiday', class: 'bg-purple-50 text-purple-700 border-purple-100', iconClass: 'text-purple-500' },
  leave: { icon: Clock, label: 'On Leave', class: 'bg-gray-50 text-gray-700 border-gray-100', iconClass: 'text-gray-500' },
  excused_absence: { icon: FileText, label: 'Excused Absence', class: 'bg-indigo-50 text-indigo-700 border-indigo-100', iconClass: 'text-indigo-500' },
}

// Reasons HR can pick from when an employee is not in. Anything picked here turns the
// record into an "Excused Absence" instead of a plain "Absent".
const ABSENCE_REASONS = [
  'Sick / Medical',
  'Approved Leave',
  'Family Emergency',
  'Bereavement',
  'Official Business / Field Work',
  'Training / Workshop',
  'Maternity / Paternity',
  'Other',
]

const OTHER_REASON = 'Other'

interface BulkEntry {
  isPresent: boolean
  /** One of ABSENCE_REASONS, or '' when no reason was given (unexcused). */
  reason: string
  /** Free text: the reason itself when "Other" is picked, otherwise an optional detail. */
  note: string
}

const emptyEntry = (isPresent: boolean): BulkEntry => ({ isPresent, reason: '', note: '' })

/** The reason string that gets persisted for an entry. */
const resolveReason = (entry: BulkEntry) =>
  entry.reason === OTHER_REASON ? entry.note.trim() : entry.reason.trim()

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<'log' | 'take'>('log')
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const [bulkState, setBulkState] = useState<Record<number, BulkEntry>>({})

  const fetchData = async () => {
    try {
      setLoading(true)
      const [attRes, empRes] = await Promise.all([
        api.get(`/api/attendance?date=${date}`),
        api.get('/api/employees')
      ])

      const loadedRecords: AttendanceRecord[] = attRes.data
      const loadedEmployees: Employee[] = empRes.data.data || empRes.data

      setRecords(loadedRecords)
      setEmployees(loadedEmployees)

      // Seed the "Take Attendance" form. With no records yet, default everyone to present
      // so HR only has to uncheck the people who did not show up.
      const initialBulk: Record<number, BulkEntry> = {}
      loadedEmployees.forEach(emp => {
        if (loadedRecords.length === 0) {
          initialBulk[emp.id] = emptyEntry(true)
          return
        }

        const empName = `${emp.first_name} ${emp.last_name}`.trim()
        const record = loadedRecords.find(r =>
          r.employee_id != null ? r.employee_id === emp.id : r.employee_name === empName
        )

        if (!record) {
          initialBulk[emp.id] = emptyEntry(false)
          return
        }

        const isPresent = ['present', 'late', 'holiday', 'half_day'].includes(record.status)
        const savedReason = record.absence_reason || ''
        const isPreset = ABSENCE_REASONS.includes(savedReason)

        initialBulk[emp.id] = {
          isPresent,
          reason: isPresent ? '' : (isPreset ? savedReason : savedReason ? OTHER_REASON : ''),
          note: isPresent ? '' : (isPreset ? (record.absence_note || '') : savedReason),
        }
      })

      setBulkState(initialBulk)

    } catch (err) {
      console.error('Failed to load data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [date])

  const toggleBulk = (empId: number) => {
    setBulkState(prev => {
      const current = prev[empId] || emptyEntry(false)
      // Marking someone present clears any reason captured while they were absent.
      return { ...prev, [empId]: current.isPresent ? emptyEntry(false) : emptyEntry(true) }
    })
  }

  const updateEntry = (empId: number, patch: Partial<BulkEntry>) => {
    setBulkState(prev => ({ ...prev, [empId]: { ...(prev[empId] || emptyEntry(false)), ...patch } }))
  }

  const toggleAll = (value: boolean) => {
    const newState: Record<number, BulkEntry> = {}
    employees.forEach(emp => { newState[emp.id] = emptyEntry(value) })
    setBulkState(newState)
  }

  const handleBulkSubmit = async () => {
    try {
      setSubmitting(true)
      const payload = {
        date: date,
        records: employees.map(emp => {
          const entry = bulkState[emp.id] || emptyEntry(false)
          const reason = entry.isPresent ? '' : resolveReason(entry)

          return {
            employee_id: emp.id,
            // An absence with a recorded reason is an excused absence, not a plain absence.
            status: entry.isPresent ? 'present' : reason ? 'excused_absence' : 'absent',
            absence_reason: reason || null,
            absence_note: !entry.isPresent && entry.reason !== OTHER_REASON && entry.note.trim()
              ? entry.note.trim()
              : null,
            check_in: entry.isPresent ? '09:00' : null,
            check_out: entry.isPresent ? '17:00' : null,
          }
        })
      }
      await api.post('/api/attendance/bulk', payload)
      setActiveTab('log')
      fetchData()
    } catch (err) {
      alert('Failed to save attendance')
    } finally {
      setSubmitting(false)
    }
  }

  const present = records.filter(r => r.status === 'present').length
  const absent = records.filter(r => r.status === 'absent').length
  const excusedAbsence = records.filter(r => r.status === 'excused_absence').length
  const onLeave = records.filter(r => r.status === 'leave').length

  // Live counters for the Take Attendance tab.
  const markedEntries = employees.map(emp => bulkState[emp.id] || emptyEntry(false))
  const takePresent = markedEntries.filter(e => e.isPresent).length
  const takeExcused = markedEntries.filter(e => !e.isPresent && resolveReason(e)).length
  const takeUnexcused = markedEntries.length - takePresent - takeExcused

  if (loading && records.length === 0) return (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="w-10 h-10 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">Manage employee daily attendance</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-violet-400 outline-none"
          />
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('log')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'log' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Daily Log
            </button>
            <button
              onClick={() => setActiveTab('take')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'take' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Take Attendance
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'log' ? (
        <>
          {/* Summary Cards — excused absences replace the old "Late" tile */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { label: 'Present', value: present, bg: 'bg-emerald-500', icon: CheckCircle2 },
              { label: 'Excused Absences', value: excusedAbsence, bg: 'bg-indigo-500', icon: FileText },
              { label: 'Absent', value: absent, bg: 'bg-red-500', icon: XCircle },
              { label: 'On Leave', value: onLeave, bg: 'bg-gray-500', icon: Users },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center shadow-lg`}>
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
              <h3 className="text-sm font-bold text-gray-900">Attendance Log for {date}</h3>
              <button className="inline-flex items-center gap-1.5 text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                <Download className="h-3.5 w-3.5" /> Export
              </button>
            </div>

            {records.length === 0 ? (
              <div className="py-12 text-center">
                <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-900">No attendance records today</p>
                <p className="text-xs text-gray-500 mt-1">Switch to &quot;Take Attendance&quot; to mark employees.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Check In</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Check Out</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Absence Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((record, idx) => {
                    const config = statusConfig[record.status] || statusConfig.absent
                    const Icon = config.icon
                    return (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.employee_name}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${config.class}`}>
                            <Icon className={`h-3.5 w-3.5 ${config.iconClass}`} />
                            {config.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{record.check_in || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{record.check_out || '-'}</td>
                        <td className="px-6 py-4">
                          {record.absence_reason ? (
                            <div className="flex items-start gap-2 text-sm">
                              <MessageCircle className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <span className="text-gray-700 font-medium block truncate max-w-xs">{record.absence_reason}</span>
                                {record.absence_note && (
                                  <span className="text-xs text-gray-500 block truncate max-w-xs">{record.absence_note}</span>
                                )}
                              </div>
                            </div>
                          ) : record.status === 'absent' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
                              <AlertCircle className="h-3.5 w-3.5" /> No reason given
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        /* Take Attendance Tab */
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Mark Attendance for {date}</h3>
              <p className="text-xs text-gray-500 mt-1">
                Uncheck anyone who is not in, then pick a reason — absences with a reason are logged as
                <span className="font-semibold text-indigo-600"> Excused Absence</span>.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggleAll(true)} className="inline-flex items-center gap-1.5 text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                <Check className="h-3.5 w-3.5" /> Check All
              </button>
              <button onClick={() => toggleAll(false)} className="inline-flex items-center gap-1.5 text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                <X className="h-3.5 w-3.5" /> Uncheck All
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="text-center px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={employees.length > 0 && employees.every(e => bulkState[e.id]?.isPresent)}
                        onChange={e => toggleAll(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-sm font-medium text-gray-900">Present</span>
                    </label>
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-96">Reason for Absence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map(emp => {
                  const entry = bulkState[emp.id] || emptyEntry(false)
                  const isChecked = entry.isPresent
                  const isOther = entry.reason === OTHER_REASON
                  return (
                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors align-top">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {emp.first_name} {emp.last_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {emp.department?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <label className="inline-flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleBulk(emp.id)}
                            className="w-5 h-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                          />
                        </label>
                      </td>
                      <td className="px-6 py-4">
                        {isChecked ? (
                          <span className="text-xs text-gray-400 italic">Present — no reason needed</span>
                        ) : (
                          <div className="space-y-2">
                            <select
                              value={entry.reason}
                              onChange={e => updateEntry(emp.id, { reason: e.target.value, note: '' })}
                              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                            >
                              <option value="">No reason given (unexcused)</option>
                              {ABSENCE_REASONS.map(reason => (
                                <option key={reason} value={reason}>{reason}</option>
                              ))}
                            </select>

                            {entry.reason !== '' && (
                              <input
                                type="text"
                                value={entry.note}
                                onChange={e => updateEntry(emp.id, { note: e.target.value })}
                                placeholder={isOther ? 'Specify the reason...' : 'Add a note (optional)'}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                              />
                            )}

                            {isOther && !entry.note.trim() && (
                              <p className="inline-flex items-center gap-1 text-xs text-amber-600">
                                <AlertCircle className="h-3.5 w-3.5" /> Specify a reason, or it will be logged as absent.
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-semibold">
              <span className="text-emerald-600">{takePresent} present</span>
              <span className="text-indigo-600">{takeExcused} excused absence{takeExcused === 1 ? '' : 's'}</span>
              <span className="text-red-600">{takeUnexcused} absent without reason</span>
            </div>
            <button
              onClick={handleBulkSubmit}
              disabled={submitting || employees.length === 0}
              className="w-full bg-gradient-to-r from-violet-600 to-violet-500 text-white py-2.5 rounded-lg font-medium hover:from-violet-700 hover:to-violet-600 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="h-5 w-5" />
              {submitting ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

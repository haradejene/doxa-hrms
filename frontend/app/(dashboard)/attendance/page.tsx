'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Clock, Download, Save, Loader2, Users } from 'lucide-react'
import api from '@/services/api'

interface AttendanceRecord {
  id: number
  employee_name: string
  date: string
  status: 'present' | 'late' | 'absent' | 'half_day' | 'holiday' | 'leave'
  check_in: string | null
  check_out: string | null
  employee_id?: number
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
}

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<'log' | 'take'>('log')
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  // Bulk attendance state: employee_id -> isPresent (boolean)
  const [bulkState, setBulkState] = useState<Record<number, boolean>>({})

  const fetchData = async () => {
    try {
      setLoading(true)
      const [attRes, empRes] = await Promise.all([
        api.get(`/api/attendance?date=${date}`),
        api.get('/api/employees')
      ])
      
      const loadedRecords = attRes.data
      const loadedEmployees = empRes.data.data || empRes.data
      
      setRecords(loadedRecords)
      setEmployees(loadedEmployees)

      // Initialize bulk state based on existing records
      const initialBulk: Record<number, boolean> = {}
      // Default everyone to unchecked (absent)
      loadedEmployees.forEach((emp: Employee) => {
        initialBulk[emp.id] = false
      })
      // Tick those who are present/late in the DB
      loadedRecords.forEach((rec: AttendanceRecord) => {
        // Find employee id from record if available, else we rely on exact name matching (hacky, but backend now returns employee_id? wait, backend doesn't return employee_id in GET /attendance currently, I'll assume we can match by name or default all to true if empty)
        // To be safe, default all to true if no records exist for the day, otherwise use existing
      })

      // Better logic: if there are NO records for today, default everyone to PRESENT (checked) to save time.
      // If there ARE records, check only those who have status = 'present' or 'late'
      if (loadedRecords.length === 0) {
        loadedEmployees.forEach((emp: Employee) => {
          initialBulk[emp.id] = true
        })
      } else {
        // match by name since backend index doesn't expose employee_id (it exposes employee_name)
        loadedEmployees.forEach((emp: Employee) => {
          const empName = `${emp.first_name} ${emp.last_name}`.trim()
          const record = loadedRecords.find((r: any) => r.employee_name === empName)
          if (record && (record.status === 'present' || record.status === 'late')) {
            initialBulk[emp.id] = true
          } else {
            initialBulk[emp.id] = false
          }
        })
      }

      setBulkState(initialBulk)

    } catch (err) {
      console.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [date])

  const toggleBulk = (empId: number) => {
    setBulkState(prev => ({ ...prev, [empId]: !prev[empId] }))
  }
  
  const toggleAll = (value: boolean) => {
    const newState: Record<number, boolean> = {}
    employees.forEach(emp => { newState[emp.id] = value })
    setBulkState(newState)
  }

  const handleBulkSubmit = async () => {
    try {
      setSubmitting(true)
      const payload = {
        date: date,
        records: employees.map(emp => ({
          employee_id: emp.id,
          status: bulkState[emp.id] ? 'present' : 'absent',
          check_in: bulkState[emp.id] ? '09:00' : null,
          check_out: bulkState[emp.id] ? '17:00' : null,
        }))
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
  const late = records.filter(r => r.status === 'late').length
  const absent = records.filter(r => r.status === 'absent').length

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
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'log' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Daily Log
            </button>
            <button
              onClick={() => setActiveTab('take')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'take' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Take Attendance
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'log' ? (
        <>
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
              <h3 className="text-sm font-bold text-gray-900">Attendance Log for {date}</h3>
              <button className="inline-flex items-center gap-1.5 text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                <Download className="h-3.5 w-3.5" /> Export
              </button>
            </div>
            
            {records.length === 0 ? (
              <div className="py-12 text-center">
                <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-900">No attendance records today</p>
                <p className="text-xs text-gray-500 mt-1">Switch to "Take Attendance" to mark employees.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Employee</th>
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
        </>
      ) : (
        /* Take Attendance Tab */
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-stone-50">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Mark Attendance for {date}</h3>
              <p className="text-xs text-gray-500 mt-0.5">Check the box if the employee is present.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggleAll(true)} className="text-xs font-semibold text-violet-600 hover:underline">Mark All Present</button>
              <span className="text-gray-300">|</span>
              <button onClick={() => toggleAll(false)} className="text-xs font-semibold text-gray-500 hover:underline">Clear All</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 w-16">
                    <CheckCircle2 className="h-4 w-4 text-gray-400" />
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Department</th>
                  <th className="text-right px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {employees.map((emp) => {
                  const isPresent = bulkState[emp.id]
                  return (
                    <tr 
                      key={emp.id} 
                      onClick={() => toggleBulk(emp.id)}
                      className={`cursor-pointer transition-colors ${isPresent ? 'bg-violet-50/30 hover:bg-violet-50/60' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-6 py-3.5">
                        <input 
                          type="checkbox"
                          checked={isPresent || false}
                          onChange={() => toggleBulk(emp.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold flex-shrink-0">
                            {emp.first_name[0]}{emp.last_name[0]}
                          </div>
                          <span className="text-sm font-bold text-gray-900">{emp.first_name} {emp.last_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-500 hidden sm:table-cell">
                        {emp.department?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {isPresent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md">
                            Absent
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-stone-50 border-t border-gray-100 flex justify-end">
            <button
              onClick={handleBulkSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-md shadow-violet-500/20"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Attendance
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
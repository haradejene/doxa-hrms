'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, UserPlus, Mail, Phone, MoreVertical, Eye, SlidersHorizontal } from 'lucide-react'
import api from '@/services/api'
import Link from 'next/link'

interface Employee {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  employee_number: string
  department: { name: string }
  position: { title: string }
  status: 'active' | 'on_leave' | 'terminated' | 'probation'
  hire_date: string
}

const avatarGradients = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-blue-600',
]

const statusConfig: Record<string, { label: string; class: string }> = {
  active: { label: 'Active', class: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  on_leave: { label: 'On Leave', class: 'bg-amber-50 text-amber-700 border-amber-100' },
  terminated: { label: 'Terminated', class: 'bg-red-50 text-red-700 border-red-100' },
  probation: { label: 'Probation', class: 'bg-blue-50 text-blue-700 border-blue-100' },
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  useEffect(() => { fetchEmployees() }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/employees')
      setEmployees(response.data)
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase()
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = filterDepartment === 'all' || emp.department?.name === filterDepartment
    const matchesStatus = filterStatus === 'all' || emp.status === filterStatus
    return matchesSearch && matchesDepartment && matchesStatus
  })

  const departments = [...new Set(employees.map(e => e.department?.name))].filter(Boolean)

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading employees...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-violet-600 bg-violet-50 border border-violet-100 px-2.5 py-0.5 rounded-full">{employees.length} employees</span>
          </div>
        </div>
        <Link href="/employees/new" className="btn-primary self-start sm:self-auto">
          <UserPlus className="h-4 w-4" />
          Add Employee
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="card p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search by name, email, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="input-field md:w-48"
        >
          <option value="all">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input-field md:w-40"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="on_leave">On Leave</option>
          <option value="probation">Probation</option>
          <option value="terminated">Terminated</option>
        </select>
        <div className="flex items-center gap-1 border border-gray-200 rounded-xl p-1 bg-gray-50">
          <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-violet-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-violet-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400 font-medium">Showing {filteredEmployees.length} of {employees.length} employees</p>

      {/* Employee Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredEmployees.map((employee, i) => {
            const status = statusConfig[employee.status] ?? { label: employee.status, class: 'bg-gray-100 text-gray-600 border-gray-200' }
            return (
              <div key={employee.id} className="card p-5 hover:shadow-md hover:border-violet-200 transition-all duration-200 group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarGradients[i % avatarGradients.length]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 group-hover:scale-105 transition-transform`}>
                      {employee.first_name[0]}{employee.last_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-violet-700 transition-colors">
                        {employee.first_name} {employee.last_name}
                      </p>
                      <p className="text-xs text-gray-400">{employee.position?.title ?? 'No position'}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${status.class}`}>
                    {status.label}
                  </span>
                </div>

                <div className="space-y-2 border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-5 h-5 rounded bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-3 w-3 text-violet-500" />
                    </div>
                    <span className="truncate">{employee.email}</span>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-5 h-5 rounded bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-3 w-3 text-blue-500" />
                      </div>
                      <span>{employee.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-gray-400">Dept: <span className="font-medium text-gray-600">{employee.department?.name ?? 'N/A'}</span></span>
                    <span className="text-xs text-gray-400 font-mono">{employee.employee_number}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Department</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Contact</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredEmployees.map((emp, i) => {
                const status = statusConfig[emp.status] ?? { label: emp.status, class: 'bg-gray-100 text-gray-600 border-gray-200' }
                return (
                  <tr key={emp.id} className="hover:bg-violet-50/30 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatarGradients[i % avatarGradients.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {emp.first_name[0]}{emp.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{emp.first_name} {emp.last_name}</p>
                          <p className="text-xs text-gray-400">{emp.position?.title ?? 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-500 hidden md:table-cell">{emp.department?.name ?? 'N/A'}</td>
                    <td className="px-6 py-3.5 text-sm text-gray-500 hidden lg:table-cell">{emp.email}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${status.class}`}>{status.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {filteredEmployees.length === 0 && (
        <div className="card py-16 text-center">
          <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-violet-300" />
          </div>
          <p className="text-base font-semibold text-gray-700">No employees found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}
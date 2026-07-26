'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, UserPlus, Mail, Phone, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import api from '@/services/api'

interface Employee {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  employee_number: string
  department: { name: string }
  position: { title: string }
  status: 'active' | 'on_leave' | 'terminated'
  hire_date: string
  full_name: string
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    fetchEmployees()
  }, [])

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'on_leave': return 'bg-yellow-100 text-yellow-700'
      case 'terminated': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Employees</h1>
          <p className="mt-1 text-sm text-gray-500">Manage employee records and information</p>
        </div>
        <button className="inline-flex items-center rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-2 text-sm font-medium text-white hover:from-purple-700 hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-lg">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="all">All Departments</option>
          {[...new Set(employees.map(e => e.department?.name))].filter(Boolean).map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="on_leave">On Leave</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEmployees.map((employee) => (
          <div key={employee.id} className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center text-purple-600 font-medium text-lg group-hover:scale-110 transition-transform">
                  {employee.first_name[0]}{employee.last_name[0]}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 group-hover:text-purple-700 transition-colors">
                    {employee.first_name} {employee.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">{employee.position?.title || 'No position'}</p>
                </div>
              </div>
              <button className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
            
            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
              <div className="flex items-center text-sm text-gray-500">
                <span className="font-medium text-gray-700 w-24">Department:</span>
                {employee.department?.name || 'N/A'}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <span className="font-medium text-gray-700 w-24">Email:</span>
                <a href={`mailto:${employee.email}`} className="text-purple-600 hover:underline truncate">
                  {employee.email}
                </a>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <span className="font-medium text-gray-700 w-24">Phone:</span>
                {employee.phone || 'N/A'}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(employee.status)}`}>
                  {employee.status?.replace('_', ' ') || 'Active'}
                </span>
                <span className="text-xs text-gray-400">ID: {employee.employee_number}</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-purple-50 hover:border-purple-200 transition-colors">
                <Mail className="inline h-3 w-3 mr-1" />
                Email
              </button>
              <button className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-purple-50 hover:border-purple-200 transition-colors">
                <Eye className="inline h-3 w-3 mr-1" />
                View
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
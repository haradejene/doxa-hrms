'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import { ArrowLeft, User, Mail, Phone, Briefcase, Calendar, Edit2, Check, X } from 'lucide-react'
import Link from 'next/link'

interface Employee {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  department: { id: number; name: string }
  position: { id: number; title: string }
  status: string
  hire_date: string
  employment_type: string
  base_salary: string
}

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Employee>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    fetchEmployee()
  }, [params.id])

  const fetchEmployee = async () => {
    try {
      const res = await api.get(`/api/employees/${params.id}`)
      setEmployee(res.data)
      setFormData(res.data)
    } catch (err) {
      console.error('Failed to fetch employee', err)
      setError('Employee not found')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    try {
      setLoading(true)
      const dataToSubmit = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        status: formData.status,
        employment_type: formData.employment_type,
        base_salary: formData.base_salary,
        // department_id: formData.department?.id, // Assuming department editing might need a separate fetch for list
      }
      const res = await api.put(`/api/employees/${params.id}`, dataToSubmit)
      setEmployee(res.data)
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to update employee', err)
      setError('Failed to update employee')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !employee) return <div className="p-8 text-center text-gray-500">Loading...</div>
  if (error || !employee) return <div className="p-8 text-center text-red-500">{error}</div>

  const initials = `${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`.toUpperCase()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/employees" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Employee Details</h1>
        <div className="ml-auto">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Edit2 className="h-4 w-4" /> Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsEditing(false)
                  setFormData(employee)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 rounded-lg text-sm font-medium text-white hover:bg-violet-700 transition-colors"
              >
                <Check className="h-4 w-4" /> {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 shadow-lg shadow-purple-200">
            {initials}
          </div>
          
          <div className="flex-1 space-y-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.first_name || ''}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                ) : (
                  <p className="text-lg font-medium text-gray-900">{employee.first_name}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.last_name || ''}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                ) : (
                  <p className="text-lg font-medium text-gray-900">{employee.last_name}</p>
                )}
              </div>

              {/* Contact */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><Mail className="h-3 w-3" /> Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900">{employee.email}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><Phone className="h-3 w-3" /> Phone</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900">{employee.phone || 'N/A'}</p>
                )}
              </div>

              {/* Work details */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><Briefcase className="h-3 w-3" /> Status</label>
                {isEditing ? (
                  <select
                    value={formData.status || ''}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="terminated">Terminated</option>
                  </select>
                ) : (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    employee.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                    employee.status === 'on_leave' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {employee.status.replace('_', ' ')}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Hire Date</label>
                <p className="text-sm text-gray-900">{employee.hire_date || 'N/A'}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</label>
                <p className="text-sm font-medium text-gray-900">{employee.department?.name || 'Unassigned'}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Position</label>
                <p className="text-sm font-medium text-gray-900">{employee.position?.title || 'Unassigned'}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Employment Type</label>
                {isEditing ? (
                   <select
                   value={formData.employment_type || ''}
                   onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                   className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                 >
                   <option value="full_time">Full Time</option>
                   <option value="part_time">Part Time</option>
                   <option value="contract">Contract</option>
                 </select>
                ) : (
                  <p className="text-sm font-medium text-gray-900">{employee.employment_type?.replace('_', ' ') || 'N/A'}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Base Salary</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.base_salary || ''}
                    onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900">{employee.base_salary ? `ETB ${Number(employee.base_salary).toLocaleString()}` : 'N/A'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

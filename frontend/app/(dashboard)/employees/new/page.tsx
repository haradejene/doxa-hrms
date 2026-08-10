'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, X, UserPlus } from 'lucide-react'
import Link from 'next/link'
import api from '@/services/api'

export default function NewEmployeePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    employee_number: '',
    department_id: '',
    position_id: '',
    hire_date: '',
    employment_type: 'full_time',
    base_salary: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/api/employees', formData)
      router.push('/employees')
    } catch (error) {
      console.error('Failed to create employee:', error)
      alert('Failed to create employee. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/employees"
          className="text-gray-500 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Add New Employee</h1>
          <p className="mt-1 text-sm text-gray-500">Create a new employee record</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="e.g., Abebe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="e.g., Tadesse"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="e.g., abebe.tadesse@doxa.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="e.g., +251 911 234 567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee Number *
              </label>
              <input
                type="text"
                required
                value={formData.employee_number}
                onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="e.g., EMP001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hire Date *
              </label>
              <input
                type="date"
                required
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="">Select Department</option>
                <option value="1">Engineering</option>
                <option value="2">Design</option>
                <option value="3">Product</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employment Type
              </label>
              <select
                value={formData.employment_type}
                onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Salary
              </label>
              <input
                type="number"
                value={formData.base_salary}
                onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="e.g., 18000"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-2.5 rounded-lg font-medium hover:from-purple-700 hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {loading ? 'Creating...' : 'Add Employee'}
            </button>
            <Link
              href="/employees"
              className="inline-flex items-center text-gray-600 hover:text-gray-800 px-4 py-2.5"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}

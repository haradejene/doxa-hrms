'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, X, DollarSign, Calendar, Users } from 'lucide-react'
import Link from 'next/link'
import api from '@/services/api'

export default function ProcessPayrollPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    period: '',
    start_date: '',
    end_date: '',
    payment_date: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/api/payroll', formData)
      router.push('/payroll')
    } catch (error) {
      console.error('Failed to process payroll:', error)
      alert('Failed to process payroll. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/payroll"
          className="text-gray-500 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Process Payroll</h1>
          <p className="mt-1 text-sm text-gray-500">Generate payroll for all employees</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
          <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Payroll Processing</p>
            <p className="text-sm text-gray-500">This will generate payroll for all active employees</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payroll Period *
            </label>
            <input
              type="text"
              required
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
              className="w-full sm:w-96 rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="e.g., January 2024"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Total Employees: <strong className="text-gray-900">156</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Total Payroll: <strong className="text-gray-900">$1,247,500</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Period: <strong className="text-gray-900">Monthly</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-2.5 rounded-lg font-medium hover:from-purple-700 hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Processing...' : 'Process Payroll'}
            </button>
            <Link
              href="/payroll"
              className="inline-flex items-center text-gray-600 hover:text-gray-800 px-4 py-2.5"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
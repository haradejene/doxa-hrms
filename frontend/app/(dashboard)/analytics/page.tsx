'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Users, Briefcase, DollarSign, Calendar, Download, Filter, BarChart3 } from 'lucide-react'
import api from '@/services/api'

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      const response = await api.get('/api/analytics/metrics')
      setMetrics(response.data)
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setLoading(false)
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Monitor workforce metrics and insights</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:border-purple-200 transition-colors">
            <Download className="mr-2 h-4 w-4" />
            Export
          </button>
          <button className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:border-purple-200 transition-colors">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="h-8 w-8 text-purple-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">Analytics Module</h3>
        <p className="text-gray-500 text-sm mt-1">Coming soon - Connected to backend</p>
      </div>
    </div>
  )
}
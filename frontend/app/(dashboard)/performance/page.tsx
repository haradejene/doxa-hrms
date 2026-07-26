'use client'

import { useState, useEffect } from 'react'
import { Star, Award, TrendingUp } from 'lucide-react'
import api from '@/services/api'

interface PerformanceRecord {
  id: number
  employee_name: string
  reviewer: string
  score: number | null
  date: string
  status: 'completed' | 'in_progress'
}

export default function PerformancePage() {
  const [records, setRecords] = useState<PerformanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPerformance()
  }, [])

  const fetchPerformance = async () => {
    try {
      const response = await api.get('/api/performance')
      setRecords(response.data)
    } catch (error) {
      console.error('Failed to fetch performance reviews:', error)
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
          <h1 className="text-2xl font-semibold text-gray-900">Performance Reviews</h1>
          <p className="mt-1 text-sm text-gray-500">Track employee goals, appraisals, and KPIs</p>
        </div>
        <button className="inline-flex items-center rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-2 text-sm font-medium text-white hover:from-purple-700 hover:to-purple-600 transition-all duration-300 shadow-md">
          <Star className="mr-2 h-4 w-4" />
          New Review
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {records.map((record) => (
          <div key={record.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-24 h-24 text-purple-600" />
            </div>
            
            <div className="relative">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{record.employee_name}</h3>
                  <p className="text-sm text-gray-500">Reviewed by {record.reviewer}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                  record.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {record.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="flex items-end justify-between mt-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Overall Score</p>
                  <div className="flex items-center gap-1">
                    <Award className="h-5 w-5 text-purple-500" />
                    <span className="text-2xl font-bold text-gray-900">
                      {record.score ? `${record.score} / 5.0` : 'N/A'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-400">{record.date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
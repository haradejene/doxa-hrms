'use client'

import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Comprehensive HR metrics and reporting</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Turnover Rate</p>
            <p className="text-2xl font-bold text-gray-900">4.2%</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Growth Rate</p>
            <p className="text-2xl font-bold text-gray-900">+12%</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Avg Salary</p>
            <p className="text-2xl font-bold text-gray-900">$78,500</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Avg Tenure</p>
            <p className="text-2xl font-bold text-gray-900">3.5 yrs</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center py-20">
        <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Advanced Analytics Module</h3>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">
          Detailed charting and exporting capabilities will be available in the upcoming Q3 release.
        </p>
      </div>
    </div>
  )
}
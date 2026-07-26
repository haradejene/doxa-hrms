'use client'

import { ArrowUp, ArrowDown } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  trend?: number
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'orange'
}

export function StatCard({ title, value, icon: Icon, trend, color }: StatCardProps) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 hover:border-purple-200 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center">
        <div className={`rounded-lg p-3 ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {trend !== undefined && (
              <span className={`ml-2 flex items-center text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

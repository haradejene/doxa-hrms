'use client'

import { ArrowUp, ArrowDown, LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  trend?: number
  trendLabel?: string
  gradient: string
  iconBg: string
}

export function StatCard({ title, value, icon: Icon, trend, trendLabel, gradient, iconBg }: StatCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 text-white ${gradient} shadow-lg`}>
      {/* Background decoration */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -right-2 w-16 h-16 rounded-full bg-white/5" />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1 ${trend >= 0 ? 'bg-white/20 text-white' : 'bg-white/20 text-white'}`}>
              {trend >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        <p className="text-sm font-medium text-white/80 mt-1">{title}</p>
        {trendLabel && <p className="text-xs text-white/60 mt-0.5">{trendLabel}</p>}
      </div>
    </div>
  )
}

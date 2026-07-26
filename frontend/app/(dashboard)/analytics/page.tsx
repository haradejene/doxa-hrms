'use client'

import { BarChart3, TrendingUp, Users, DollarSign, ArrowUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const metrics = [
  { label: 'Employee Turnover', value: '4.2%', sub: 'vs 5.1% last quarter', trend: 'down', good: true, bg: 'bg-emerald-500' },
  { label: 'Headcount Growth', value: '+12%', sub: 'vs +8% last quarter', trend: 'up', good: true, bg: 'bg-violet-500' },
  { label: 'Avg Salary', value: '$78,500', sub: '+3.2% this year', trend: 'up', good: true, bg: 'bg-blue-500' },
  { label: 'Avg Tenure', value: '3.5 yrs', sub: 'Median: 2.8 yrs', trend: 'up', good: true, bg: 'bg-amber-500' },
]

const quickLinks = [
  { href: '/employees', label: 'Employee Directory', icon: Users, desc: 'Browse all employees' },
  { href: '/payroll', label: 'Payroll Summary', icon: DollarSign, desc: 'Review compensation data' },
  { href: '/performance', label: 'Performance Trends', icon: TrendingUp, desc: 'Track team KPIs' },
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="card p-6 hover:shadow-md transition-all duration-200">
            <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center mb-4`}>
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-black text-gray-900">{m.value}</p>
            <p className="text-sm font-medium text-gray-600 mt-0.5">{m.label}</p>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <ArrowUp className={`h-3 w-3 ${m.good ? 'text-emerald-500' : 'text-red-500'}`} />
              {m.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="card p-8 flex flex-col items-center justify-center py-20 text-center border-dashed border-2 border-gray-200">
        <div className="w-20 h-20 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <BarChart3 className="h-10 w-10 text-violet-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Advanced Analytics</h3>
        <p className="text-gray-400 mt-2 text-sm max-w-md">
          Interactive charts and exportable reports will be available in the next release. For now, navigate to individual modules for data.
        </p>
        <div className="flex gap-2 mt-6 flex-wrap justify-center">
          {quickLinks.map(l => (
            <Link key={l.href} href={l.href} className="btn-secondary text-sm">
              <l.icon className="h-4 w-4" />
              {l.label}
              <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, ChevronRight, CheckCircle2, FileClock, Users, Wallet } from 'lucide-react'
import { getPayrollPeriods, type PayrollPeriod } from '@/services/payroll'

const birr = (n: number | null | undefined) => {
  if (n === null || n === undefined) return '—'
  return 'Br ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function PayrollListPage() {
  const router = useRouter()
  const [periods, setPeriods] = useState<PayrollPeriod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPayrollPeriods()
      .then(setPeriods)
      .catch(() => setPeriods([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-10 h-10 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payroll Periods</h1>
        <p className="text-sm text-gray-400">Select a month to process, view, or manage payroll sheets.</p>
      </div>

      {/* Period Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {periods.map(p => (
          <div
            key={p.period}
            onClick={() => router.push(`/payroll/${p.period}`)}
            className="card p-6 hover:shadow-md hover:border-violet-200 transition-all duration-200 group cursor-pointer flex flex-col justify-between min-h-[180px]"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-violet-600" />
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    p.status === 'processed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-amber-50 text-amber-700 border border-amber-100'
                  }`}
                >
                  {p.status === 'processed' ? (
                    <><CheckCircle2 className="h-3 w-3" /> Processed</>
                  ) : (
                    <><FileClock className="h-3 w-3" /> Draft</>
                  )}
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 group-hover:text-violet-700 transition-colors">
                {p.label}
              </h3>
              
              {p.ethiopian && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {p.ethiopian.month_name} {p.ethiopian.year} E.C
                </p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
              {p.status === 'processed' ? (
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1"><Wallet className="h-3.5 w-3.5 text-gray-400" /> {birr(p.total_net)}</span>
                </div>
              ) : (
                <span className="text-amber-600 font-medium">Click to process draft</span>
              )}
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        ))}
      </div>

      {periods.length === 0 && (
        <div className="card py-16 text-center">
          <p className="text-base font-semibold text-gray-700">No payroll periods available</p>
        </div>
      )}
    </div>
  )
}

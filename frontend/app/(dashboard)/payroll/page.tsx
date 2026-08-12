'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, ChevronRight, CheckCircle2, FileClock, Wallet, Search, Plus, X } from 'lucide-react'
import { getPayrollPeriods, type PayrollPeriod } from '@/services/payroll'

const birr = (n: number | null | undefined) => {
  if (n === null || n === undefined) return '—'
  return 'Br ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Returns YYYY-MM string for a given month/year. */
function toKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function AddMonthModal({
  existingPeriods,
  onClose,
  onAdd,
}: {
  existingPeriods: string[]
  onClose: () => void
  onAdd: (period: string) => void
}) {
  const now = new Date()
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [year, setYear] = useState(String(now.getFullYear()))
  const [error, setError] = useState('')

  const handleAdd = () => {
    const key = toKey(parseInt(year), parseInt(month))
    if (existingPeriods.includes(key)) {
      setError(`${MONTH_NAMES[parseInt(month) - 1]} ${year} is already in the list.`)
      return
    }
    onAdd(key)
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const years: number[] = []
  for (let y = now.getFullYear() + 1; y >= now.getFullYear() - 5; y--) years.push(y)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Add Payroll Month</h3>
            <p className="text-xs text-gray-400 mt-0.5">A draft sheet will be prepared automatically.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-medium text-amber-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Month</label>
              <select
                value={month}
                onChange={e => { setMonth(e.target.value); setError('') }}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={i} value={String(i + 1)}>{name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Year</label>
              <select
                value={year}
                onChange={e => { setYear(e.target.value); setError('') }}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
              >
                {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            This will open a draft payroll sheet for{' '}
            <span className="font-semibold text-gray-600">{MONTH_NAMES[parseInt(month) - 1]} {year}</span>.
            All eligible employees will be included automatically.
          </p>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-sm font-semibold text-white shadow-md shadow-purple-500/20 hover:from-violet-700 hover:to-purple-700 transition-all"
          >
            Open Sheet
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PayrollListPage() {
  const router = useRouter()
  const [periods, setPeriods] = useState<PayrollPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    getPayrollPeriods()
      .then(setPeriods)
      .catch(() => setPeriods([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return periods
    return periods.filter(p =>
      p.label.toLowerCase().includes(q) ||
      (p.ethiopian?.month_name ?? '').toLowerCase().includes(q) ||
      String(p.ethiopian?.year ?? '').includes(q) ||
      p.period.includes(q)
    )
  }, [periods, search])

  const existingKeys = useMemo(() => periods.map(p => p.period), [periods])

  const handleAdd = (period: string) => {
    setShowAddModal(false)
    router.push(`/payroll/${period}`)
  }

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
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Periods</h1>
          <p className="text-sm text-gray-400">Select a month to process, view, or manage payroll sheets.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 text-sm font-semibold text-white shadow-md shadow-purple-500/20 hover:from-violet-700 hover:to-purple-700 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Month
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search months… e.g. August, Nehase"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-10 rounded-xl border border-gray-200 bg-white pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none transition-all shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Period Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(p => (
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

      {filtered.length === 0 && (
        <div className="card py-16 text-center">
          {search ? (
            <>
              <p className="text-base font-semibold text-gray-700">No months match &ldquo;{search}&rdquo;</p>
              <p className="text-sm text-gray-400 mt-1">Try a different month name or year.</p>
            </>
          ) : (
            <p className="text-base font-semibold text-gray-700">No payroll periods available</p>
          )}
        </div>
      )}

      {showAddModal && (
        <AddMonthModal
          existingPeriods={existingKeys}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  )
}

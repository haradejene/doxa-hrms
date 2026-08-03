'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Star, TrendingUp, Award, CheckCircle2, Clock, Plus, Search, Filter,
  X, Pencil, Trash2, ChevronDown, AlertCircle, Loader2, Target, MessageSquare, BarChart2,
} from 'lucide-react'
import api from '@/services/api'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Employee {
  id: number
  first_name: string
  last_name: string
  department?: { name: string }
  position?: { title: string }
}

interface PerformanceReview {
  id: number
  employee_id: number
  reviewer_id: number
  employee_name: string
  reviewer_name: string
  employee_department: string
  employee_position: string
  review_date: string
  period: string
  period_start_date: string
  period_end_date: string
  rating: number | null
  strengths: string | null
  areas_for_improvement: string | null
  goals_achieved: string | null
  goals_for_next_period: string | null
  manager_comments: string | null
  employee_comments: string | null
  status: 'draft' | 'submitted' | 'reviewed' | 'completed'
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { value: 'all', label: 'All Periods' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'mid_year', label: 'Mid-Year' },
  { value: 'annual', label: 'Annual' },
  { value: 'probation', label: 'Probation' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'completed', label: 'Completed' },
]

const avatarGradients = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',
]

const statusStyles: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-600 border-gray-200',
  submitted: 'bg-blue-50 text-blue-700 border-blue-100',
  reviewed:  'bg-amber-50 text-amber-700 border-amber-100',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
}

const periodLabel: Record<string, string> = {
  quarterly: 'Q',
  mid_year:  'Mid',
  annual:    'Annual',
  probation: 'Prob.',
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(s)}
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          className="focus:outline-none"
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              s <= (hover || value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-200 fill-gray-200'
            } ${onChange ? 'cursor-pointer hover:scale-110' : ''}`}
          />
        </button>
      ))}
    </div>
  )
}

function ScoreBadge({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs text-gray-400">No rating</span>
  const color = rating >= 4 ? 'text-emerald-600' : rating >= 3 ? 'text-amber-600' : 'text-red-500'
  return (
    <span className={`text-3xl font-black ${color} leading-none`}>
      {rating}<span className="text-sm font-normal text-gray-400">/5</span>
    </span>
  )
}

// ─── Review Modal ─────────────────────────────────────────────────────────────

function ReviewModal({
  onClose,
  onSaved,
  editing,
  employees,
}: {
  onClose: () => void
  onSaved: () => void
  editing: PerformanceReview | null
  employees: Employee[]
}) {
  const isEdit = !!editing
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    employee_id:           editing?.employee_id?.toString() ?? '',
    period:                editing?.period ?? 'quarterly',
    review_date:           editing?.review_date ?? new Date().toISOString().slice(0, 10),
    period_start_date:     editing?.period_start_date ?? '',
    period_end_date:       editing?.period_end_date ?? '',
    rating:                editing?.rating ?? 0,
    status:                editing?.status ?? 'draft',
    strengths:             editing?.strengths ?? '',
    areas_for_improvement: editing?.areas_for_improvement ?? '',
    goals_achieved:        editing?.goals_achieved ?? '',
    goals_for_next_period: editing?.goals_for_next_period ?? '',
    manager_comments:      editing?.manager_comments ?? '',
    employee_comments:     editing?.employee_comments ?? '',
  })

  const set = (key: string, val: unknown) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.employee_id || !form.period_start_date || !form.period_end_date) {
      setError('Please fill in all required fields.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, employee_id: Number(form.employee_id) }
      if (isEdit) {
        await api.put(`/api/performance/${editing!.id}`, payload)
      } else {
        await api.post('/api/performance', payload)
      }
      onSaved()
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message ?? 'Failed to save review.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
              <Award className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{isEdit ? 'Edit Review' : 'Start Performance Review'}</h2>
              <p className="text-xs text-gray-400">Fill in the review details below</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* People */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Employee <span className="text-red-400">*</span></label>
              <select className="input-field" value={form.employee_id} onChange={e => set('employee_id', e.target.value)} required>
                <option value="">Select employee…</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Period & Status */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Period Type <span className="text-red-400">*</span></label>
              <select className="input-field" value={form.period} onChange={e => set('period', e.target.value)}>
                <option value="quarterly">Quarterly</option>
                <option value="mid_year">Mid-Year</option>
                <option value="annual">Annual</option>
                <option value="probation">Probation</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Period Start <span className="text-red-400">*</span></label>
              <input type="date" className="input-field" value={form.period_start_date} onChange={e => set('period_start_date', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Period End <span className="text-red-400">*</span></label>
              <input type="date" className="input-field" value={form.period_end_date} onChange={e => set('period_end_date', e.target.value)} required />
            </div>
          </div>

          {/* Review date + status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Review Date</label>
              <input type="date" className="input-field" value={form.review_date} onChange={e => set('review_date', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
              <select className="input-field" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="reviewed">Reviewed</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Overall Rating</label>
            <div className="flex items-center gap-3">
              <StarRating value={form.rating} onChange={v => set('rating', v)} />
              {form.rating > 0 && (
                <span className="text-sm font-bold text-gray-700">{form.rating}/5</span>
              )}
              {form.rating > 0 && (
                <button type="button" onClick={() => set('rating', 0)} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
              )}
            </div>
          </div>

          {/* Text areas */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Strengths</label>
              <textarea className="input-field resize-none" rows={2} placeholder="Key strengths observed…" value={form.strengths} onChange={e => set('strengths', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Areas for Improvement</label>
              <textarea className="input-field resize-none" rows={2} placeholder="Areas to work on…" value={form.areas_for_improvement} onChange={e => set('areas_for_improvement', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Goals Achieved</label>
                <textarea className="input-field resize-none" rows={2} placeholder="Goals met this period…" value={form.goals_achieved} onChange={e => set('goals_achieved', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Goals for Next Period</label>
                <textarea className="input-field resize-none" rows={2} placeholder="Goals for next period…" value={form.goals_for_next_period} onChange={e => set('goals_for_next_period', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Manager Comments</label>
                <textarea className="input-field resize-none" rows={2} placeholder="Manager's notes…" value={form.manager_comments} onChange={e => set('manager_comments', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Employee Comments</label>
                <textarea className="input-field resize-none" rows={2} placeholder="Employee's self-assessment…" value={form.employee_comments} onChange={e => set('employee_comments', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
              {isEdit ? 'Save Changes' : 'Create Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteModal({ review, onClose, onDeleted }: { review: PerformanceReview; onClose: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/api/performance/${review.id}`)
      onDeleted()
      onClose()
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="h-7 w-7 text-red-500" />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">Delete Review</h3>
        <p className="text-sm text-gray-500 mb-6">
          Delete the review for <strong>{review.employee_name}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors">
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PerformancePage() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [periodFilter, setPeriodFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<PerformanceReview | null>(null)
  const [toDelete, setToDelete] = useState<PerformanceReview | null>(null)

  const fetchReviews = useCallback(async () => {
    try {
      const params: Record<string, string> = {}
      if (search) params.search = search
      if (periodFilter !== 'all') params.period = periodFilter
      if (statusFilter !== 'all') params.status = statusFilter

      const res = await api.get('/api/performance', { params })
      setReviews(res.data)
    } catch (err) {
      console.error('Failed to load performance reviews:', err)
    } finally {
      setLoading(false)
    }
  }, [search, periodFilter, statusFilter])

  useEffect(() => {
    setLoading(true)
    fetchReviews()
  }, [fetchReviews])

  useEffect(() => {
    api.get('/api/employees').then(r => setEmployees(r.data)).catch(() => {})
  }, [])

  const openCreate = () => { setEditing(null); setShowModal(true) }
  const openEdit = (r: PerformanceReview) => { setEditing(r); setShowModal(true) }

  // Computed stats
  const completed  = reviews.filter(r => r.status === 'completed')
  const inProgress = reviews.filter(r => r.status !== 'completed')
  const withRating = reviews.filter(r => r.rating != null)
  const avgRating  = withRating.length
    ? withRating.reduce((s, r) => s + (r.rating ?? 0), 0) / withRating.length
    : 0

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Performance Reviews</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track, manage and run employee performance cycles</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" />
          Start Review
        </button>
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5 bg-gradient-to-br from-amber-500 to-orange-500 text-white relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
          <Star className="h-5 w-5 text-white/70 mb-2" />
          <p className="text-3xl font-black">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</p>
          <p className="text-xs text-white/70 mt-0.5">Avg. Rating</p>
        </div>
        <div className="card p-5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Completed</p>
            <p className="text-2xl font-black text-gray-900">{completed.length}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">In Progress</p>
            <p className="text-2xl font-black text-gray-900">{inProgress.length}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
            <BarChart2 className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Reviews</p>
            <p className="text-2xl font-black text-gray-900">{reviews.length}</p>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className="input-field pl-9"
            placeholder="Search by employee name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <select
            className="input-field pr-8 appearance-none cursor-pointer"
            value={periodFilter}
            onChange={e => setPeriodFilter(e.target.value)}
          >
            {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            className="input-field pr-8 appearance-none cursor-pointer"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Loading reviews…</p>
          </div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="card p-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
            <Award className="h-8 w-8 text-violet-400" />
          </div>
          <h3 className="text-base font-bold text-gray-800 mb-1">No reviews found</h3>
          <p className="text-sm text-gray-400 mb-6">
            {search || periodFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters.'
              : 'Start your first performance review to track employee progress.'}
          </p>
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" />
            Start First Review
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {reviews.map((r, i) => (
            <div
              key={r.id}
              className="card p-5 hover:shadow-md hover:border-violet-200 transition-all duration-200 group flex flex-col gap-4"
            >
              {/* Card header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarGradients[i % avatarGradients.length]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                    {r.employee_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">{r.employee_name}</p>
                    <p className="text-xs text-gray-400 leading-tight">{r.employee_position} · {r.employee_department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(r)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setToDelete(r)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusStyles[r.status]}`}>
                  {r.status.replace('_', ' ')}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                  {periodLabel[r.period] ?? r.period}
                </span>
                <span className="text-[10px] text-gray-400 ml-auto">{r.review_date}</span>
              </div>

              {/* Rating */}
              <div className="border-t border-gray-50 pt-4 flex items-center justify-between">
                <ScoreBadge rating={r.rating} />
                <StarRating value={r.rating ?? 0} />
              </div>

              {/* Reviewer */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-500">
                  {r.reviewer_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <p className="text-xs text-gray-400">Reviewed by <span className="text-gray-600 font-medium">{r.reviewer_name}</span></p>
              </div>

              {/* Snippets */}
              {r.strengths && (
                <div className="flex items-start gap-2">
                  <Target className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-500 line-clamp-2">{r.strengths}</p>
                </div>
              )}
              {r.manager_comments && (
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-500 line-clamp-2">{r.manager_comments}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {showModal && (
        <ReviewModal
          onClose={() => setShowModal(false)}
          onSaved={fetchReviews}
          editing={editing}
          employees={employees}
        />
      )}
      {toDelete && (
        <DeleteModal
          review={toDelete}
          onClose={() => setToDelete(null)}
          onDeleted={fetchReviews}
        />
      )}
    </div>
  )
}
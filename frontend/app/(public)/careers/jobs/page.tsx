'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, MapPin, Clock, ArrowRight, Briefcase, Filter, X, ChevronDown } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Job {
  id: number
  title: string
  department: { name: string } | string
  location: string
  type: string
  posted_date: string
  slug: string
  description: string
  salary_min?: number
  salary_max?: number
}

const jobTypes = ['full_time', 'part_time', 'contract', 'remote', 'hybrid']
const typeLabel: Record<string, string> = {
  full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract',
  remote: 'Remote', hybrid: 'Hybrid',
}
const typeBadge: Record<string, string> = {
  full_time: 'bg-violet-50 text-violet-700 border-violet-100',
  part_time: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  contract:  'bg-amber-50 text-amber-700 border-amber-100',
  remote:    'bg-teal-50 text-teal-700 border-teal-100',
  hybrid:    'bg-blue-50 text-blue-700 border-blue-100',
}

function getDeptName(d: Job['department']) {
  return typeof d === 'string' ? d : d?.name ?? 'N/A'
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search)     params.set('search', search)
      if (filterType) params.set('type', filterType)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs?${params}`)
      const data = await res.json()
      setJobs(data)
    } catch {
      console.error('Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }, [search, filterType])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const clearFilters = () => { setSearch(''); setFilterType('') }
  const hasFilters = search || filterType

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top search hero ── */}
      <div className="bg-white border-b border-gray-100 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-2">All open positions</p>
          <h1 className="text-4xl font-black text-gray-900 mb-6">Find your next role</h1>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title or team…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                showFilters || hasFilters
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasFilters && <span className="w-2 h-2 bg-emerald-400 rounded-full" />}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filter pills */}
          {showFilters && (
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              {jobTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(filterType === t ? '' : t)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    filterType === t
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {typeLabel[t]}
                </button>
              ))}
              {hasFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold text-gray-500 border border-gray-200 hover:border-red-200 hover:text-red-500 transition-all">
                  <X className="h-3 w-3" /> Clear all
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Job list ── */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            <span className="font-bold text-gray-900">{jobs.length}</span> {jobs.length === 1 ? 'position' : 'positions'} available
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1">
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-10 h-10 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Finding opportunities…</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
            <Briefcase className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-base font-bold text-gray-700">No positions found</h3>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or remove filters.</p>
            <button onClick={clearFilters} className="mt-5 text-sm text-violet-600 font-semibold hover:underline">Clear filters</button>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const badgeClass = typeBadge[job.type] ?? 'bg-gray-100 text-gray-600 border-gray-200'
              return (
                <Link
                  key={job.id}
                  href={`/careers/jobs/${job.slug || job.id}`}
                  className="group block bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-violet-200 transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-2.5">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
                          {typeLabel[job.type] ?? job.type}
                        </span>
                        <span className="text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded-full">
                          {getDeptName(job.department)}
                        </span>
                      </div>

                      <h2 className="text-base font-black text-gray-900 group-hover:text-violet-700 transition-colors">
                        {job.title}
                      </h2>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-400 font-medium">
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />{job.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDistanceToNow(new Date(job.posted_date), { addSuffix: true })}
                        </span>
                        {job.salary_min && job.salary_max && (
                          <span className="text-gray-600 font-semibold">
                            ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {job.description && (
                        <p className="mt-2.5 text-sm text-gray-500 line-clamp-2 leading-relaxed">
                          {typeof job.description === 'string'
                            ? job.description.replace(/<[^>]*>/g, '').slice(0, 160)
                            : ''}
                        </p>
                      )}
                    </div>

                    {/* Arrow CTA */}
                    <div className="flex-shrink-0 hidden sm:flex">
                      <span className="flex items-center gap-1.5 text-sm font-bold text-violet-600 group-hover:gap-2.5 transition-all">
                        Apply <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

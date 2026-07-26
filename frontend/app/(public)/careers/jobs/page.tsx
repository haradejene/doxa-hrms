'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, MapPin, Briefcase, Clock, Filter, X, ArrowRight, ChevronDown } from 'lucide-react'
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

const typeColors: Record<string, string> = {
  full_time: 'bg-violet-100 text-violet-700',
  part_time: 'bg-indigo-100 text-indigo-700',
  contract: 'bg-cyan-100 text-cyan-700',
  remote: 'bg-teal-100 text-teal-700',
  hybrid: 'bg-purple-100 text-purple-700',
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({ type: '', location: '' })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => { fetchJobs() }, [searchTerm, filters])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(filters.type && { type: filters.type }),
        ...(filters.location && { location: filters.location }),
      })
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs?${params}`)
      const data = await response.json()
      setJobs(data)
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDeptName = (dept: Job['department']) =>
    typeof dept === 'string' ? dept : dept?.name ?? 'N/A'

  const clearFilters = () => {
    setSearchTerm('')
    setFilters({ type: '', location: '' })
  }
  const hasFilters = searchTerm || filters.type || filters.location

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-950 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-black mb-3">Open Positions</h1>
          <p className="text-violet-300 text-lg mb-10">Find your next opportunity and join a team that cares about its people.</p>

          {/* Search Bar */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-300" />
              <input
                type="text"
                placeholder="Search job titles, departments..."
                className="w-full bg-transparent pl-10 pr-4 py-2.5 text-white placeholder:text-violet-400 outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white font-medium transition-colors"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasFilters && <span className="w-2 h-2 bg-emerald-400 rounded-full" />}
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 mt-3 flex flex-col sm:flex-row gap-3">
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl text-white text-sm px-3 py-2 outline-none"
              >
                <option value="">All Types</option>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
              <select
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl text-white text-sm px-3 py-2 outline-none"
              >
                <option value="">All Locations</option>
                <option value="remote">Remote</option>
                <option value="nyc">New York</option>
                <option value="sf">San Francisco</option>
                <option value="london">London</option>
              </select>
              {hasFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-violet-300 hover:text-white transition-colors px-3">
                  <X className="h-4 w-4" /> Clear
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Job List */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            Showing <span className="font-bold text-gray-900">{jobs.length}</span> positions
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin mb-3" />
            <p className="text-sm text-gray-400">Finding opportunities...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-violet-300" />
            </div>
            <h3 className="text-base font-bold text-gray-800">No positions found</h3>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
            <button onClick={clearFilters} className="mt-4 text-sm text-violet-600 font-semibold hover:underline">Clear all filters</button>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const typeClass = typeColors[job.type] ?? 'bg-gray-100 text-gray-600'
              return (
                <Link
                  key={job.id}
                  href={`/careers/jobs/${job.slug || job.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:border-violet-200 transition-all duration-300 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${typeClass}`}>
                          {job.type?.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] font-medium text-violet-600 bg-violet-50 border border-violet-100 px-2.5 py-0.5 rounded-full">
                          {getDeptName(job.department)}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-violet-700 transition-colors mb-2">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        {job.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />{job.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          {formatDistanceToNow(new Date(job.posted_date), { addSuffix: true })}
                        </span>
                        {job.salary_min && job.salary_max && (
                          <span className="font-semibold text-gray-600">
                            ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}
                          </span>
                        )}
                      </div>
                      {job.description && (
                        <p className="mt-3 text-sm text-gray-500 line-clamp-2 leading-relaxed">
                          {job.description.replace(/<[^>]*>/g, '')}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex sm:flex-col items-center sm:items-end gap-3">
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-violet-600 group-hover:gap-2 transition-all">
                        Apply Now <ArrowRight className="h-4 w-4" />
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

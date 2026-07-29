'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Users, MapPin, Clock, Eye, Edit, Trash2, ChevronRight } from 'lucide-react'
import api from '@/services/api'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface JobPosting {
  id: number
  title: string
  department: { name: string }
  location: string
  type: string
  applications_count: number
  status: 'published' | 'draft' | 'closed' | 'on_hold'
  posted_date: string
  slug: string
}

const statusConfig: Record<string, { label: string; class: string; dot: string }> = {
  published: { label: 'Live', class: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
  draft: { label: 'Draft', class: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' },
  closed: { label: 'Closed', class: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
  on_hold: { label: 'On Hold', class: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-400' },
}

const typeColors: Record<string, string> = {
  full_time: 'bg-violet-50 text-violet-700',
  part_time: 'bg-indigo-50 text-indigo-700',
  contract: 'bg-cyan-50 text-cyan-700',
  remote: 'bg-teal-50 text-teal-700',
  hybrid: 'bg-purple-50 text-purple-700',
}

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => { fetchJobs() }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/job-postings')
      setJobs(response.data)
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: jobs.length,
    live: jobs.filter(j => j.status === 'published').length,
    draft: jobs.filter(j => j.status === 'draft').length,
    applications: jobs.reduce((sum, j) => sum + (j.applications_count || 0), 0),
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading jobs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'Total Jobs', value: stats.total, color: 'text-gray-700' },
            { label: 'Live', value: stats.live, color: 'text-emerald-600' },
            { label: 'Draft', value: stats.draft, color: 'text-amber-600' },
            { label: 'Applications', value: stats.applications, color: 'text-violet-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-3 py-1.5">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
        <Link href="/recruitment/new" className="btn-primary self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Post New Job
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search by title or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {['all', 'published', 'draft', 'closed'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                filterStatus === status ? 'bg-white shadow-sm text-violet-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {status === 'all' ? 'All' : statusConfig[status]?.label ?? status}
            </button>
          ))}
        </div>
      </div>

      {/* Job Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredJobs.map((job) => {
          const status = statusConfig[job.status] ?? { label: job.status, class: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' }
          const typeClass = typeColors[job.type] ?? 'bg-gray-100 text-gray-600'
          return (
            <div key={job.id} className="card p-5 hover:shadow-md hover:border-violet-200 transition-all duration-200 group cursor-pointer" onClick={() => window.location.href = `/recruitment/${job.id}`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${typeClass}`}>
                    {job.type?.replace('_', ' ')}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${status.class}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 group-hover:text-violet-700 transition-colors mb-1">
                  {job.title}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-violet-50 flex items-center justify-center">
                      <Users className="h-2.5 w-2.5 text-violet-500" />
                    </div>
                    {job.department?.name ?? 'N/A'}
                  </span>
                  {job.location && (
                    <span className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-blue-50 flex items-center justify-center">
                        <MapPin className="h-2.5 w-2.5 text-blue-500" />
                      </div>
                      {job.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-gray-100 flex items-center justify-center">
                      <Clock className="h-2.5 w-2.5 text-gray-400" />
                    </div>
                    {job.posted_date ? formatDistanceToNow(new Date(job.posted_date), { addSuffix: true }) : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{job.applications_count ?? 0}</p>
                  <p className="text-xs text-gray-400">applicants</p>
                </div>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => window.location.href = `/recruitment/${job.id}`} className="p-2 rounded-lg text-gray-400 hover:bg-violet-50 hover:text-violet-600 transition-colors">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredJobs.length === 0 && (
        <div className="card py-16 text-center">
          <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-violet-300" />
          </div>
          <p className="text-base font-semibold text-gray-700">No jobs found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or post a new job.</p>
        </div>
      )}
    </div>
  )
}
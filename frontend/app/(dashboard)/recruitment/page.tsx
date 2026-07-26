'use client'

import { useState, useEffect } from 'react'
import { Plus, Filter, Search, MoreVertical, Eye, Edit, Trash2, Users } from 'lucide-react'
import api from '@/services/api'
import Link from 'next/link'

interface JobPosting {
  id: number
  title: string
  department: { name: string }
  location: string
  type: string
  applications_count: number
  status: 'published' | 'draft' | 'closed'
  posted_date: string
  slug: string
}

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/jobs')
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700'
      case 'draft': return 'bg-yellow-100 text-yellow-700'
      case 'closed': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Recruitment</h1>
          <p className="mt-1 text-sm text-gray-500">Manage job postings and track applicants</p>
        </div>
        <Link
          href="/dashboard/recruitment/new"
          className="inline-flex items-center rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-2 text-sm font-medium text-white hover:from-purple-700 hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          Post New Job
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Job List */}
      <div className="overflow-hidden rounded-xl bg-white border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Job Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Applicants</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredJobs.map((job) => (
              <tr key={job.id} className="hover:bg-purple-50/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{job.title}</div>
                  <div className="text-xs text-gray-500">{job.type?.replace('_', ' ')}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{job.department?.name || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{job.location || 'Remote'}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3 text-gray-400" />
                    {job.applications_count || 0}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(job.status)}`}>
                    {job.status?.charAt(0).toUpperCase() + job.status?.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="rounded-lg p-1 text-gray-400 hover:bg-purple-100 hover:text-purple-600 transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="rounded-lg p-1 text-gray-400 hover:bg-purple-100 hover:text-purple-600 transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="rounded-lg p-1 text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
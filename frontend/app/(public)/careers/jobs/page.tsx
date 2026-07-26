'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, MapPin, Briefcase, Clock, Filter, X, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Job {
  id: number
  title: string
  department: string
  location: string
  type: string
  posted_date: string
  slug: string
  description: string
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({ type: '', location: '' })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchJobs()
  }, [searchTerm, filters])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchTerm,
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

  const clearFilters = () => {
    setSearchTerm('')
    setFilters({ type: '', location: '' })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Open Positions</h1>
        <p className="text-gray-500 mt-1">Find your next career opportunity at Doxa</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, department, or keyword..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {Object.values(filters).some(v => v) && (
                <span className="ml-2 w-2 h-2 bg-purple-600 rounded-full" />
              )}
            </button>
            {Object.values(filters).some(v => v) && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter dropdown */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <select
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            >
              <option value="">All Locations</option>
              <option value="remote">Remote</option>
              <option value="nyc">New York</option>
              <option value="sf">San Francisco</option>
              <option value="london">London</option>
            </select>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-700">{jobs.length}</span> positions
        </p>
      </div>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="h-8 w-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No jobs found</h3>
          <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
          <button
            onClick={clearFilters}
            className="mt-4 text-purple-600 font-medium hover:text-purple-700"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/careers/jobs/${job.slug || job.id}`}
              className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-purple-200 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                      {job.department}
                    </span>
                    {job.type && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {job.type.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                    {job.title}
                  </h3>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Posted {formatDistanceToNow(new Date(job.posted_date), { addSuffix: true })}
                    </span>
                  </div>
                  {job.description && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                      {job.description.replace(/<[^>]*>/g, '')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="text-purple-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                    Apply Now
                  </span>
                  <ArrowRight className="h-4 w-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, MapPin, Briefcase, Calendar, Building, 
  CheckCircle, Award, Clock, Share2, Bookmark 
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Job {
  id: number
  title: string
  department: string
  location: string
  type: string
  posted_date: string
  description: string
  requirements: string[]
  responsibilities: string[]
  salary_min: number
  salary_max: number
  benefits: string[]
}

export default function JobDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (slug) {
      fetchJob()
    }
  }, [slug])

  const fetchJob = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${slug}`)
      if (!response.ok) throw new Error('Job not found')
      const data = await response.json()
      setJob(data)
    } catch (err) {
      setError('Failed to load job details')
    } finally {
      setLoading(false)
    }
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

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Briefcase className="h-10 w-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
        <p className="text-gray-600 mb-6">The position you're looking for has been filled or is no longer available.</p>
        <Link
          href="/careers/jobs"
          className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Browse All Jobs
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <Link
        href="/careers/jobs"
        className="inline-flex items-center text-gray-500 hover:text-purple-600 transition-colors mb-6 text-sm"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Jobs
      </Link>

      {/* Job Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                {job.department}
              </span>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {job.type?.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Posted {formatDistanceToNow(new Date(job.posted_date), { addSuffix: true })}
              </span>
              {job.salary_min && job.salary_max && (
                <span className="flex items-center gap-1 text-gray-700 font-medium">
                  <Award className="h-4 w-4" />
                  ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="inline-flex items-center text-gray-500 hover:text-purple-600 transition-colors px-3 py-2 rounded-lg border border-gray-200 hover:border-purple-200">
              <Bookmark className="h-4 w-4 mr-1.5" />
              Save
            </button>
            <button className="inline-flex items-center text-gray-500 hover:text-purple-600 transition-colors px-3 py-2 rounded-lg border border-gray-200 hover:border-purple-200">
              <Share2 className="h-4 w-4 mr-1.5" />
              Share
            </button>
          </div>
        </div>

        {/* Apply Button */}
        <div className="mt-6 pt-6 border-t border-gray-100 flex justify-center">
          <Link
            href={`/apply/${job.id}`}
            className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-10 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Apply Now
          </Link>
        </div>
      </div>

      {/* Job Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
        {/* Description */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Job Description</h2>
          <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed">
            <p>{job.description}</p>
          </div>
        </div>

        {/* Responsibilities */}
        {job.responsibilities && job.responsibilities.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Key Responsibilities</h2>
            <ul className="space-y-2">
              {job.responsibilities.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-600">
                  <CheckCircle className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Requirements</h2>
            <ul className="space-y-2">
              {job.requirements.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-600">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Benefits */}
        {job.benefits && job.benefits.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">What We Offer</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {job.benefits.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-600 bg-purple-50 px-4 py-2 rounded-lg">
                  <Award className="h-4 w-4 text-purple-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Apply Now */}
        <div className="pt-6 border-t border-gray-100 text-center">
          <p className="text-gray-600 mb-4">Ready to join our team?</p>
          <Link
            href={`/apply/${job.id}`}
            className="inline-flex items-center bg-gradient-to-r from-purple-600 to-purple-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Apply for this position
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

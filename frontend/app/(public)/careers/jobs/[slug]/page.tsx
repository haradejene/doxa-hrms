'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Briefcase, Calendar, Award, Share2, Bookmark, CheckCircle, DollarSign, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Job {
  id: number
  title: string
  department: { name: string } | string
  location: string
  type: string
  posted_date: string
  description: string
  requirements: string[]
  responsibilities: string[]
  salary_min: number
  salary_max: number
  benefits: string[]
  experience_level: string
}

const typeColors: Record<string, string> = {
  full_time: 'bg-violet-100 text-violet-700',
  part_time: 'bg-indigo-100 text-indigo-700',
  contract: 'bg-cyan-100 text-cyan-700',
  remote: 'bg-teal-100 text-teal-700',
  hybrid: 'bg-purple-100 text-purple-700',
}

export default function JobDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (slug) fetchJob()
  }, [slug])

  const fetchJob = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${slug}`)
      if (!response.ok) throw new Error('Job not found')
      const data = await response.json()

      const parseField = (field: any) => {
        if (!field) return []
        if (Array.isArray(field)) return field
        return typeof field === 'string' ? field.split('\n').filter(Boolean) : []
      }

      setJob({
        ...data,
        requirements: parseField(data.requirements),
        responsibilities: parseField(data.responsibilities),
        benefits: parseField(data.benefits),
        department: typeof data.department === 'object' ? data.department?.name : data.department,
      })
    } catch (err) {
      setError('Job not found')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading position...</p>
      </div>
    </div>
  )

  if (error || !job) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Briefcase className="h-10 w-10 text-red-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Position Not Found</h2>
        <p className="text-gray-500 mb-6">This role may have been filled or removed.</p>
        <Link href="/careers/jobs" className="btn-primary inline-flex">Browse All Jobs</Link>
      </div>
    </div>
  )

  const typeClass = typeColors[job.type] ?? 'bg-gray-100 text-gray-600'
  const deptName = typeof job.department === 'object' ? (job.department as any)?.name : job.department

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-violet-950 to-indigo-900 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/careers/jobs" className="inline-flex items-center gap-1.5 text-violet-300 hover:text-white transition-colors text-sm mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Jobs
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white border border-white/20`}>
              {job.type?.replace('_', ' ')}
            </span>
            <span className="text-xs text-violet-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
              {deptName}
            </span>
            {job.experience_level && (
              <span className="text-xs text-violet-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full capitalize">
                {job.experience_level}
              </span>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-5">{job.title}</h1>

          <div className="flex flex-wrap gap-6 text-sm text-violet-300">
            {job.location && (
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4" />{job.location}</span>
            )}
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Posted {formatDistanceToNow(new Date(job.posted_date), { addSuffix: true })}
            </span>
            {job.salary_min && job.salary_max && (
              <span className="flex items-center gap-2 font-bold text-white">
                <DollarSign className="h-4 w-4" />
                ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()} / yr
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              href={`/careers/apply/${job.id}`}
              className="inline-flex items-center gap-2 bg-white text-violet-800 px-7 py-3.5 rounded-2xl font-bold hover:bg-violet-50 transition-all shadow-2xl shadow-violet-900/50"
            >
              Apply Now <ChevronRight className="h-4 w-4" />
            </Link>
            <button className="inline-flex items-center gap-2 border border-white/25 text-white px-5 py-3.5 rounded-2xl font-medium hover:bg-white/10 transition-all">
              <Bookmark className="h-4 w-4" /> Save
            </button>
            <button className="inline-flex items-center gap-2 border border-white/25 text-white px-5 py-3.5 rounded-2xl font-medium hover:bg-white/10 transition-all">
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* Description */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">About this role</h2>
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">{job.description}</p>
        </div>

        {/* Responsibilities */}
        {job.responsibilities?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Key Responsibilities</h2>
            <ul className="space-y-3">
              {job.responsibilities.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-600 text-sm">
                  <CheckCircle className="h-5 w-5 text-violet-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Requirements */}
        {job.requirements?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Requirements</h2>
            <ul className="space-y-3">
              {job.requirements.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-600 text-sm">
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mt-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Benefits */}
        {job.benefits?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-5">What we offer</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {job.benefits.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-xl px-4 py-2.5">
                  <Award className="h-4 w-4 text-violet-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final CTA */}
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-8 text-center text-white relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
          <h3 className="text-xl font-bold mb-2">Ready to apply?</h3>
          <p className="text-violet-200 text-sm mb-6">Join our team and help build the future of HR technology.</p>
          <Link
            href={`/careers/apply/${job.id}`}
            className="inline-flex items-center gap-2 bg-white text-violet-700 px-8 py-3.5 rounded-2xl font-bold hover:bg-violet-50 transition-all shadow-lg"
          >
            Apply for this position <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

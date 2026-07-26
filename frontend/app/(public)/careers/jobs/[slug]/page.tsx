'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Clock, DollarSign, CheckCircle, Bookmark, Share2, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Job {
  id: number
  title: string
  department: any
  location: string
  type: string
  posted_date: string
  description: string
  requirements: string[]
  responsibilities: string[]
  salary_min?: number
  salary_max?: number
  benefits?: string[]
  experience_level?: string
}

const typeLabel: Record<string, string> = {
  full_time: 'Full-time', part_time: 'Part-time',
  contract: 'Contract', remote: 'Remote', hybrid: 'Hybrid',
}

function parse(field: any): string[] {
  if (!field) return []
  if (Array.isArray(field)) return field
  if (typeof field === 'string') return field.split('\n').filter(Boolean)
  return []
}

export default function JobDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${slug}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => setJob({ ...data, requirements: parse(data.requirements), responsibilities: parse(data.responsibilities), benefits: parse(data.benefits) }))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  )

  if (notFound || !job) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center px-4">
      <div>
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">🔍</span>
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Position not found</h2>
        <p className="text-gray-500 text-sm mb-6">This role may have been filled or removed.</p>
        <Link href="/careers/jobs" className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-violet-600 transition-colors">
          Browse all roles
        </Link>
      </div>
    </div>
  )

  const dept = typeof job.department === 'object' ? job.department?.name : job.department

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Back */}
        <Link href="/careers/jobs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 font-semibold mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> All positions
        </Link>

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {job.type && (
              <span className="text-xs font-bold bg-violet-50 text-violet-700 border border-violet-100 px-3 py-1 rounded-full">
                {typeLabel[job.type] ?? job.type}
              </span>
            )}
            {dept && (
              <span className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">{dept}</span>
            )}
            {job.experience_level && (
              <span className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full capitalize">{job.experience_level}</span>
            )}
          </div>

          <h1 className="text-3xl font-black text-gray-900 mb-4">{job.title}</h1>

          <div className="flex flex-wrap gap-5 text-sm text-gray-500 mb-6">
            {job.location && (
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="h-4 w-4 text-violet-500" />{job.location}
              </span>
            )}
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="h-4 w-4 text-violet-500" />
              {formatDistanceToNow(new Date(job.posted_date), { addSuffix: true })}
            </span>
            {job.salary_min && job.salary_max && (
              <span className="flex items-center gap-1.5 font-bold text-gray-700">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()} / yr
              </span>
            )}
          </div>

          {/* CTA row */}
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/careers/apply/${job.id}`}
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-7 py-3.5 rounded-xl font-bold hover:bg-violet-600 transition-colors text-sm"
            >
              Apply now <ChevronRight className="h-4 w-4" />
            </Link>
            <button className="inline-flex items-center gap-2 text-gray-600 border border-gray-200 px-4 py-3.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">
              <Bookmark className="h-4 w-4" /> Save
            </button>
            <button className="inline-flex items-center gap-2 text-gray-600 border border-gray-200 px-4 py-3.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6">
          <h2 className="text-lg font-black text-gray-900 mb-4">About this role</h2>
          <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">{job.description}</p>
        </div>

        {/* Responsibilities */}
        {job.responsibilities?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6">
            <h2 className="text-lg font-black text-gray-900 mb-5">What you'll do</h2>
            <ul className="space-y-3">
              {job.responsibilities.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-violet-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Requirements */}
        {job.requirements?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6">
            <h2 className="text-lg font-black text-gray-900 mb-5">What we're looking for</h2>
            <ul className="space-y-3">
              {job.requirements.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full flex-shrink-0 mt-2" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Benefits */}
        {job.benefits && job.benefits.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6">
            <h2 className="text-lg font-black text-gray-900 mb-5">What we offer</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {job.benefits.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
                  <CheckCircle className="h-4 w-4 text-violet-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="bg-gray-900 rounded-2xl p-8 text-center relative overflow-hidden">
          <div className="absolute -top-8 -left-8 w-24 h-24 bg-violet-500 rounded-full opacity-20 blur-2xl" />
          <h3 className="text-xl font-black text-white mb-2">Excited about this role?</h3>
          <p className="text-gray-400 text-sm mb-6">Join Doxa and help build something people love.</p>
          <Link
            href={`/careers/apply/${job.id}`}
            className="inline-flex items-center gap-2 bg-violet-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-violet-700 transition-colors text-sm"
          >
            Apply now <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, CheckCircle, User, Mail, Phone, FileText, Send } from 'lucide-react'

export default function ApplyPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '', cover_letter: '',
  })

  useEffect(() => {
    if (jobId) fetchJob()
  }, [jobId])

  const fetchJob = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${jobId}`)
      const data = await response.json()
      setJob(data)
    } catch (error) {
      console.error('Failed to fetch job:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const formDataObj = new FormData()
      Object.entries(formData).forEach(([key, value]) => formDataObj.append(key, value))
      formDataObj.append('job_posting_id', jobId)
      if (file) formDataObj.append('resume', file)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications`, {
        method: 'POST', body: formDataObj,
      })
      if (response.ok) {
        router.push(`/careers/apply/success?job=${jobId}`)
      } else {
        throw new Error('Application failed')
      }
    } catch (error) {
      alert('There was an error submitting your application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  )

  const deptName = job?.department?.name ?? job?.department ?? 'N/A'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-950 to-indigo-900 text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href={`/careers/jobs/${jobId}`} className="inline-flex items-center gap-1.5 text-violet-300 hover:text-white transition-colors text-sm mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Job
          </Link>
          <h1 className="text-3xl font-black">Apply for {job?.title}</h1>
          <p className="text-violet-300 mt-2 text-sm">{deptName} · {job?.location ?? 'Remote'} · {job?.type?.replace('_', ' ')}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Progress indicator */}
          <div className="flex items-center gap-3 px-8 py-5 bg-violet-50 border-b border-violet-100">
            <div className="w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
            <div className="text-sm font-semibold text-violet-800">Personal Information</div>
            <div className="h-px bg-violet-200 flex-1" />
            <div className="w-7 h-7 bg-violet-200 rounded-full flex items-center justify-center text-violet-400 text-xs font-bold">2</div>
            <div className="text-sm text-violet-400 font-medium">Documents</div>
            <div className="h-px bg-violet-200 flex-1" />
            <div className="w-7 h-7 bg-violet-200 rounded-full flex items-center justify-center text-violet-400 text-xs font-bold">3</div>
            <div className="text-sm text-violet-400 font-medium">Review</div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Name Row */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="h-3 w-3 text-violet-500" /> First Name *
                </label>
                <input
                  type="text" required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                  placeholder="John"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 block">Last Name *</label>
                <input
                  type="text" required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                  placeholder="Doe"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-violet-500" /> Email Address *
              </label>
              <input
                type="email" required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-violet-500" /> Phone Number
              </label>
              <input
                type="tel"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            {/* Resume Upload */}
            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="h-3 w-3 text-violet-500" /> Resume / CV *
              </label>
              <label
                htmlFor="resume"
                className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all ${
                  file ? 'border-violet-400 bg-violet-50' : 'border-gray-200 bg-gray-50 hover:border-violet-300 hover:bg-violet-50/50'
                }`}
              >
                <input type="file" id="resume" required accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
                {file ? (
                  <>
                    <CheckCircle className="h-8 w-8 text-violet-500" />
                    <p className="text-sm font-semibold text-violet-700">{file.name}</p>
                    <p className="text-xs text-violet-400">Click to change file</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">Drop your resume here or <span className="text-violet-600 font-semibold">click to browse</span></p>
                    <p className="text-xs text-gray-400">PDF, DOC, DOCX · Max 5MB</p>
                  </>
                )}
              </label>
            </div>

            {/* Cover Letter */}
            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 block">Cover Letter</label>
              <textarea
                rows={5}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none transition-all resize-none"
                placeholder="Tell us why you're a great fit for this role and what excites you about joining Doxa..."
                value={formData.cover_letter}
                onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-sm hover:from-violet-700 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-purple-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting application...</>
              ) : (
                <><Send className="h-4 w-4" />Submit Application</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, CheckCircle, User, Mail, Phone, FileText, Send } from 'lucide-react'

export default function ApplyPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const router = useRouter()
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', cover_letter: '' })

  useEffect(() => {
    if (!jobId) return
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${jobId}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setJob)
      .catch(() => setJob(null))
      .finally(() => setLoading(false))
  }, [jobId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('job_posting_id', jobId)
      if (file) fd.append('resume', file)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications`, { method: 'POST', body: fd })
      if (res.ok) router.push(`/careers/apply/success?job=${jobId}`)
      else throw new Error()
    } catch {
      alert('Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const dept = job?.department?.name ?? job?.department ?? 'N/A'

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  )

  if (!job) return (
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">

        <Link href={`/careers/jobs/${jobId}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 font-semibold mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to role
        </Link>

        {/* Job context */}
        {job && (
          <div className="bg-white rounded-2xl border border-gray-100 px-6 py-4 mb-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white text-base font-bold flex-shrink-0">
              {job.title?.[0] ?? 'D'}
            </div>
            <div>
              <p className="text-sm font-black text-gray-900">{job.title}</p>
              <p className="text-xs text-gray-400">{dept} · {job.location ?? 'Remote'} · {job.type?.replace('_', ' ')}</p>
            </div>
          </div>
        )}

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100">
            <h1 className="text-xl font-black text-gray-900">Your application</h1>
            <p className="text-sm text-gray-400 mt-0.5">Takes about 5 minutes. We read every application carefully.</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
            {/* Name row */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">First name *</label>
                <input
                  required type="text" placeholder="Abebe"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                  value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Last name *</label>
                <input
                  required type="text" placeholder="Tadesse"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                  value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Email *</label>
              <input
                required type="email" placeholder="abebe.tadesse@gmail.com"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Phone</label>
              <input
                type="tel" placeholder="+251 911 234 567"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            {/* File upload */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">CV / Resume *</label>
              <label
                htmlFor="resume"
                className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl p-7 cursor-pointer transition-all ${
                  file ? 'border-violet-400 bg-violet-50' : 'border-gray-200 bg-gray-50 hover:border-violet-300 hover:bg-violet-50/30'
                }`}
              >
                <input id="resume" type="file" required accept=".pdf,.doc,.docx" className="hidden" onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
                {file ? (
                  <>
                    <CheckCircle className="h-8 w-8 text-violet-500" />
                    <p className="text-sm font-semibold text-violet-700">{file.name}</p>
                    <p className="text-xs text-violet-400">Click to change</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-500">Drop your CV or <span className="text-violet-600 font-bold">click to browse</span></p>
                    <p className="text-xs text-gray-400">PDF, DOC, DOCX — max 5 MB</p>
                  </>
                )}
              </label>
            </div>

            {/* Cover letter */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Cover letter <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                rows={5} placeholder="Tell us why you're excited about this role and what makes you a great fit…"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none transition-all resize-none"
                value={form.cover_letter} onChange={e => setForm({ ...form, cover_letter: e.target.value })}
              />
            </div>

            <button
              type="submit" disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
              ) : (
                <><Send className="h-4 w-4" /> Submit application</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

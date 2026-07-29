'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import { ArrowLeft, Edit2, Check, X, MapPin, DollarSign, Calendar, Users, Briefcase, Download, Mail, Phone, FileText, Eye } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface JobPosting {
  id: number
  title: string
  department: { id: number; name: string }
  type: string
  experience_level: string
  salary_min: string
  salary_max: string
  location: string
  status: string
  posted_date: string
  description: string
  requirements: string
}

interface Application {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  cover_letter_path?: string
  resume_path?: string
  stage: 'applied' | 'screening' | 'interview_scheduled' | 'interview_completed' | 'technical_test' | 'reference_check' | 'offer_extended' | 'offer_accepted' | 'offer_declined' | 'hired' | 'rejected'
  created_at: string
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [job, setJob] = useState<JobPosting | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingApps, setLoadingApps] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<JobPosting>>({})
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)

  useEffect(() => {
    fetchJob()
    fetchApplications()
  }, [params.id])

  const fetchJob = async () => {
    try {
      const res = await api.get(`/api/jobs/${params.id}`)
      setJob(res.data)
      setFormData(res.data)
    } catch (err) {
      console.error('Failed to fetch job posting', err)
      setError('Job Posting not found')
    } finally {
      setLoading(false)
    }
  }

  const fetchApplications = async () => {
    try {
      setLoadingApps(true)
      const res = await api.get(`/api/applications?job_posting_id=${params.id}`)
      setApplications(Array.isArray(res.data) ? res.data : res.data.data || [])
    } catch (err) {
      console.error('Failed to fetch applications', err)
    } finally {
      setLoadingApps(false)
    }
  }

  const updateApplicationStatus = async (applicationId: number, newStage: string) => {
    try {
      await api.put(`/api/applications/${applicationId}`, { stage: newStage })
      setApplications(apps => apps.map(app => app.id === applicationId ? { ...app, stage: newStage as any } : app))
      setSelectedApp(prev => prev ? { ...prev, stage: newStage as any } : null)
    } catch (err) {
      console.error('Failed to update application stage', err)
    }
  }

  const handleUpdate = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccessMessage('')
      const dataToSubmit = {
        title: formData.title,
        type: formData.type,
        experience_level: formData.experience_level,
        salary_min: formData.salary_min,
        salary_max: formData.salary_max,
        location: formData.location,
        status: formData.status,
        description: formData.description,
        requirements: formData.requirements,
      }
      const res = await api.put(`/api/job-postings/${params.id}`, dataToSubmit)
      setJob(res.data)
      setFormData(res.data)
      setIsEditing(false)
      setSuccessMessage('Job posting updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error('Failed to update job posting', err)
      setError('Failed to update job posting. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading && !job) return <div className="p-8 text-center text-gray-500">Loading...</div>
  if (error || !job) return <div className="p-8 text-center text-red-500">{error}</div>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-700 text-sm font-medium">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}
      <div className="flex items-center gap-4">
        <Link href="/recruitment" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Job Details</h1>
        <div className="ml-auto">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Edit2 className="h-4 w-4" /> Edit Job
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsEditing(false)
                  setFormData(job)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 rounded-lg text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Check className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="md:col-span-2 space-y-8">
            <div className="space-y-4">
              {isEditing ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Job Title</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-lg font-bold"
                  />
                </div>
              ) : (
                <h2 className="text-3xl font-bold text-gray-900">{job.title}</h2>
              )}
              
              {!isEditing && (
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4 text-gray-400" /> {job.department?.name || 'Unassigned'}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-gray-400" /> {job.location}</span>
                  <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-gray-400" /> ETB {job.salary_min} - {job.salary_max}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-gray-400" /> Posted: {job.posted_date}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Description</h3>
              {isEditing ? (
                <textarea
                  rows={6}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                />
              ) : (
                <div className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{job.description}</div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Requirements</h3>
              {isEditing ? (
                <textarea
                  rows={6}
                  value={formData.requirements || ''}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                />
              ) : (
                <div className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{job.requirements}</div>
              )}
            </div>
          </div>

          <div className="space-y-6 bg-gray-50 p-6 rounded-2xl h-fit border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Job Details</h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</label>
                {isEditing ? (
                  <select
                    value={formData.status || ''}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="closed">Closed</option>
                  </select>
                ) : (
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      job.status === 'published' ? 'bg-emerald-50 text-emerald-700' :
                      job.status === 'draft' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900">{job.location}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</label>
                {isEditing ? (
                  <select
                    value={formData.type || ''}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                ) : (
                  <p className="text-sm font-medium text-gray-900 capitalize">{job.type?.replace('_', ' ')}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Experience Level</label>
                {isEditing ? (
                  <select
                    value={formData.experience_level || ''}
                    onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                  >
                    <option value="entry">Entry Level</option>
                    <option value="junior">Junior</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                  </select>
                ) : (
                  <p className="text-sm font-medium text-gray-900 capitalize">{job.experience_level}</p>
                )}
              </div>

              {isEditing && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Min Salary</label>
                    <input
                      type="number"
                      value={formData.salary_min || ''}
                      onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Max Salary</label>
                    <input
                      type="number"
                      value={formData.salary_max || ''}
                      onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Applications Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Applications</h3>
                <p className="text-xs text-gray-400">Total: {applications.length}</p>
              </div>
            </div>
          </div>
        </div>

        {loadingApps ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No applications yet</p>
            <p className="text-sm text-gray-400 mt-1">Applicants will appear here once they submit their applications.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {applications.map((app) => (
              <div key={app.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedApp(app)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{app.first_name} {app.last_name}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        app.stage === 'hired' ? 'bg-emerald-50 text-emerald-700' :
                        app.stage === 'rejected' ? 'bg-red-50 text-red-700' :
                        app.stage === 'interview_scheduled' || app.stage === 'interview_completed' ? 'bg-blue-50 text-blue-700' :
                        app.stage === 'screening' ? 'bg-amber-50 text-amber-700' :
                        'bg-gray-50 text-gray-700'
                      }`}>
                        {app.stage.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{app.email}</p>
                    {app.phone && <p className="text-sm text-gray-600">{app.phone}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      Applied {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedApp(app)
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Application Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Application Details</h2>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Applicant Info */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Name</p>
                    <p className="font-medium text-gray-900">{selectedApp.first_name} {selectedApp.last_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="font-medium text-gray-900 break-all">{selectedApp.email}</p>
                  </div>
                  {selectedApp.phone && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Phone</p>
                      <p className="font-medium text-gray-900">{selectedApp.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Application Date</p>
                    <p className="font-medium text-gray-900">{new Date(selectedApp.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Status Management */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Stage</h3>
                <div className="flex flex-wrap gap-2">
                  {['applied', 'screening', 'interview_scheduled', 'interview_completed', 'offer_extended', 'hired', 'rejected'].map(stage => (
                    <button
                      key={stage}
                      onClick={() => updateApplicationStatus(selectedApp.id, stage)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedApp.stage === stage
                          ? 'bg-violet-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {stage.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cover Letter */}
              {selectedApp.cover_letter_path && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Cover Letter</h3>
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL}${selectedApp.cover_letter_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download Cover Letter
                  </a>
                </div>
              )}

              {/* Resume */}
              {selectedApp.resume_path && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Resume</h3>
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL}${selectedApp.resume_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-violet-50 border border-violet-200 rounded-lg text-sm font-medium text-violet-700 hover:bg-violet-100 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download Resume
                  </a>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    window.location.href = `mailto:${selectedApp.email}`
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Send Email
                </button>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

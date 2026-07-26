'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, X, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import api from '@/services/api'

export default function NewJobPostingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    department_id: '',
    position_id: '',
    location: '',
    type: 'full_time',
    description: '',
    requirements: [''],
    responsibilities: [''],
    salary_min: '',
    salary_max: '',
    closing_date: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await api.post('/api/job-postings', formData)
      router.push('/recruitment')
    } catch (error) {
      console.error('Failed to create job posting:', error)
      alert('Failed to create job posting. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const addRequirement = () => {
    setFormData({ ...formData, requirements: [...formData.requirements, ''] })
  }

  const removeRequirement = (index: number) => {
    const newRequirements = formData.requirements.filter((_, i) => i !== index)
    setFormData({ ...formData, requirements: newRequirements })
  }

  const updateRequirement = (index: number, value: string) => {
    const newRequirements = [...formData.requirements]
    newRequirements[index] = value
    setFormData({ ...formData, requirements: newRequirements })
  }

  const addResponsibility = () => {
    setFormData({ ...formData, responsibilities: [...formData.responsibilities, ''] })
  }

  const removeResponsibility = (index: number) => {
    const newResponsibilities = formData.responsibilities.filter((_, i) => i !== index)
    setFormData({ ...formData, responsibilities: newResponsibilities })
  }

  const updateResponsibility = (index: number, value: string) => {
    const newResponsibilities = [...formData.responsibilities]
    newResponsibilities[index] = value
    setFormData({ ...formData, responsibilities: newResponsibilities })
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/recruitment"
          className="text-gray-500 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Post New Job</h1>
          <p className="mt-1 text-sm text-gray-500">Create a new job posting</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="e.g., Senior Full Stack Developer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              <select
                required
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="">Select Department</option>
                <option value="1">Engineering</option>
                <option value="2">Design</option>
                <option value="3">Product</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="e.g., Remote, New York, London"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employment Type *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          {/* Salary Range */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Salary
              </label>
              <input
                type="number"
                value={formData.salary_min}
                onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="e.g., 60000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Salary
              </label>
              <input
                type="number"
                value={formData.salary_max}
                onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="e.g., 90000"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Description *
            </label>
            <textarea
              required
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Describe the role, responsibilities, and what makes this position exciting..."
            />
          </div>

          {/* Requirements */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Requirements</label>
              <button
                type="button"
                onClick={addRequirement}
                className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Requirement
              </button>
            </div>
            {formData.requirements.map((req, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={req}
                  onChange={(e) => updateRequirement(index, e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder={`Requirement ${index + 1}`}
                />
                {formData.requirements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Responsibilities */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Responsibilities</label>
              <button
                type="button"
                onClick={addResponsibility}
                className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Responsibility
              </button>
            </div>
            {formData.responsibilities.map((resp, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={resp}
                  onChange={(e) => updateResponsibility(index, e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder={`Responsibility ${index + 1}`}
                />
                {formData.responsibilities.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeResponsibility(index)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Closing Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Closing Date
            </label>
            <input
              type="date"
              value={formData.closing_date}
              onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })}
              className="w-full sm:w-64 rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-2.5 rounded-lg font-medium hover:from-purple-700 hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Creating...' : 'Post Job'}
            </button>
            <Link
              href="/recruitment"
              className="inline-flex items-center text-gray-600 hover:text-gray-800 px-4 py-2.5"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
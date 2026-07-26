import api from './api'

export interface Job {
  id: number
  title: string
  department: string
  department_id: number
  position: string
  position_id: number
  location: string
  type: string
  description: string
  requirements: string[]
  responsibilities: string[]
  salary_min: number
  salary_max: number
  posted_date: string
  closing_date: string
  status: string
  slug: string
}

export interface Application {
  id: number
  job_posting_id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  resume_path: string
  cover_letter_path: string
  stage: string
  applied_at: string
}

export const recruitmentService = {
  // Public endpoints
  getJobs: async (params?: { search?: string; type?: string; location?: string }) => {
    const response = await api.get<Job[]>('/api/jobs', { params })
    return response.data
  },

  getJob: async (id: number | string) => {
    const response = await api.get<Job>(`/api/jobs/${id}`)
    return response.data
  },

  // Protected endpoints (HR Admin)
  createJob: async (data: Partial<Job>) => {
    const response = await api.post<Job>('/api/job-postings', data)
    return response.data
  },

  updateJob: async (id: number, data: Partial<Job>) => {
    const response = await api.put<Job>(`/api/job-postings/${id}`, data)
    return response.data
  },

  deleteJob: async (id: number) => {
    await api.delete(`/api/job-postings/${id}`)
  },

  // Applications
  getApplications: async () => {
    const response = await api.get<Application[]>('/api/applications')
    return response.data
  },

  submitApplication: async (data: FormData) => {
    const response = await api.post<Application>('/api/applications', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  updateApplicationStage: async (id: number, stage: string) => {
    const response = await api.patch<Application>(`/api/applications/${id}/stage`, { stage })
    return response.data
  },
}

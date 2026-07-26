import { useState, useEffect } from 'react'
import { recruitmentService, Job } from '@/services/recruitment'

export function useJobs(params?: { search?: string; type?: string; location?: string }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchJobs()
  }, [params?.search, params?.type, params?.location])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const data = await recruitmentService.getJobs(params)
      setJobs(data)
      setError(null)
    } catch (err) {
      setError('Failed to fetch jobs')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return { jobs, loading, error, refetch: fetchJobs }
}

import { useEffect, useState } from 'react'
import api from './api'

export type CurrentUser = { id: number; name: string; email: string; role: string }

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  useEffect(() => {
    let mounted = true
    api.get('/api/auth/me').then(({ data }) => {
      if (mounted) setUser(data)
    }).catch(() => { if (mounted) setUser(null) })
    return () => { mounted = false }
  }, [])
  return user
}

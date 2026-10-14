'use client'

import { useEffect, useState } from 'react'
import api from '@/services/api'

export default function DoxaIdentity({ employeeId, identities = [] }: {
  employeeId: number; identities?: { issuer: string; subject: string }[]
}) {
  const [authorized, setAuthorized] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let mounted = true
    api.get('/api/auth/me').then(({ data }) => {
      if (mounted) setAuthorized(data.role === 'hr_admin' && data.is_active === true)
    }).catch(() => {})
    return () => { mounted = false }
  }, [])
  async function link() {
    setPending(true)
    setError('')
    try {
      const { data } = await api.post(`/auth/doxa/employees/${employeeId}/link`, {})
      window.location.assign(data.authorization_url)
    } catch {
      setError('Unable to start linking. Check that this account is active and not already linked, then try again.')
      setPending(false)
    }
  }
  return <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3" aria-labelledby="doxa-identity-title">
    <h2 id="doxa-identity-title" className="text-lg font-semibold">Doxa Identity</h2>
    {identities.length ? <><p>Linked</p>{identities.map(identity => <dl key={`${identity.issuer}:${identity.subject}`} className="break-all text-sm">
      <dt className="font-medium">Issuer</dt><dd>{identity.issuer}</dd>
      <dt className="font-medium">Subject</dt><dd>{identity.subject}</dd>
    </dl>)}</> : <><p>Not linked</p>{authorized && <button disabled={pending} onClick={link}
      className="px-4 py-2 rounded-lg bg-violet-600 text-white disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-violet-500">
      {pending ? 'Opening Doxa…' : 'Link Doxa account'}
    </button>}</>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </section>
}

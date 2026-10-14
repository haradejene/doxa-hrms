'use client'

import { useEffect, useState } from 'react'
import api from '@/services/api'
import Link from 'next/link'

type Confirmation = { employee_name: string; identity: { name: string | null; email: string | null; issuer: string; subject: string } }

export default function DoxaLinkConfirmation({ params }: { params: { id: string } }) {
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let mounted = true
    if (params.id === 'error') {
      setError('Doxa linking was rejected. Check application access and whether the identity is already linked, then return to the employee and start again.')
      return
    }
    api.get(`/auth/doxa/link/${encodeURIComponent(params.id)}`).then(({ data }) => {
      if (mounted) setConfirmation(data)
    }).catch(() => { if (mounted) setError('This linking request is unavailable or has expired. Return to the employee and start again.') })
    return () => { mounted = false }
  }, [params.id])
  async function act(action: 'confirm' | 'cancel') {
    setPending(true)
    setError('')
    try {
      const { data } = await api.post(`/auth/doxa/link/${encodeURIComponent(params.id)}/${action}`, {})
      window.location.assign(data.destination)
    } catch {
      setError('The request could not be completed. It may have expired, access may have changed, or this identity may already be linked. Return to the employee and start again.')
      setPending(false)
      setConfirmation(null)
    }
  }
  return <section className="max-w-2xl mx-auto bg-white border rounded-2xl p-8 space-y-6" aria-labelledby="confirmation-title">
    <h1 id="confirmation-title" className="text-2xl font-bold">Confirm Doxa identity link</h1>
    {!confirmation && !error && <p role="status">Loading confirmation…</p>}
    {confirmation && <>
      <dl className="space-y-3 break-all">
        <div><dt className="font-semibold">Selected HRM employee</dt><dd>{confirmation.employee_name}</dd></div>
        <div><dt className="font-semibold">Authenticated Doxa identity</dt><dd>{confirmation.identity.name || 'Name not provided'}</dd><dd>{confirmation.identity.email}</dd></div>
        <div><dt className="font-semibold">Doxa issuer</dt><dd>{confirmation.identity.issuer}</dd></div>
        <div><dt className="font-semibold">Doxa subject</dt><dd>{confirmation.identity.subject}</dd></div>
      </dl>
      <p>Confirm that this Doxa identity should be linked to this HRM account.</p>
      <div className="flex gap-3">
        <button disabled={pending} onClick={() => act('confirm')} className="bg-violet-600 text-white rounded-lg px-4 py-2 disabled:opacity-50">{pending ? 'Processing…' : 'Confirm link'}</button>
        <button disabled={pending} onClick={() => act('cancel')} className="border rounded-lg px-4 py-2 disabled:opacity-50">Cancel</button>
      </div>
    </>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <Link href="/employees" className="inline-block text-violet-700 underline">Return to employees</Link>
  </section>
}

'use client'

import { useEffect, useRef, useState } from 'react'
import api from '@/services/api'
import Link from 'next/link'
import type { AxiosError } from 'axios'

type Confirmation = { employee_name: string; identity: { name: string | null; email: string | null; issuer: string; subject: string } }

export default function DoxaLinkConfirmation({ params }: { params: { id: string } }) {
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [recoverable, setRecoverable] = useState(false)
  const busy = useRef(false)
  useEffect(() => {
    let mounted = true
    if (params.id === 'error') {
      setError('Doxa linking was rejected. Check application access and whether the identity is already linked, then return to the employee and start again.')
      return
    }
    api.get(`/auth/doxa/link/${encodeURIComponent(params.id)}`).then(({ data }) => {
      if (!mounted) return
      if (data.status === 'completed') window.location.assign(data.destination)
      else if (data.status === 'processing') {
        setRecoverable(true)
        setError('Linking is still processing. Check the result again shortly. If it expires, return to the employee and start again.')
      } else setConfirmation(data)
    }).catch((failure: AxiosError) => {
      if (!mounted) return
      if (!failure.response || failure.response.status >= 500) {
        setRecoverable(true)
        setError('The result is temporarily unavailable. Check again shortly.')
      } else setError('This linking request is unavailable or has expired. Return to the employee and start again.')
    })
    return () => { mounted = false }
  }, [params.id])
  async function act(action: 'confirm' | 'cancel') {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    try {
      const { data } = await api.post(`/auth/doxa/link/${encodeURIComponent(params.id)}/${action}`, {})
      if (data.status === 'processing') {
        setError('Linking is still processing. Check the result again shortly.')
        setRecoverable(true)
        setConfirmation(null)
        setPending(false)
      } else window.location.assign(data.destination)
    } catch (failure) {
      const response = (failure as AxiosError<{ error?: string }>)?.response
      if (!response || response.status >= 500 || response.data?.error === 'link_unavailable') {
        setError('The result could not be verified. Check the result before starting another link.')
        setRecoverable(true)
        setPending(false)
        setConfirmation(null)
        return
      }
      setRecoverable(false)
      setError('The request could not be completed. It may have expired, access may have changed, or this identity may already be linked. Return to the employee and start again.')
      setPending(false)
      setConfirmation(null)
    } finally { busy.current = false }
  }
  async function checkResult() {
    if (busy.current) return
    busy.current = true
    setPending(true)
    try {
      const { data } = await api.get(`/auth/doxa/link/${encodeURIComponent(params.id)}`)
      if (data.status === 'completed') window.location.assign(data.destination)
      else if (data.status === 'verified') {
        setConfirmation(data)
        setRecoverable(false)
        setError('The link has not completed. You can confirm it again.')
      } else setError('Linking is still processing. Check again shortly; an expired request requires a new link.')
    } catch (failure) {
      const response = (failure as AxiosError)?.response
      if (response && response.status < 500) {
        setRecoverable(false)
        setError('This request has expired, was cancelled, or conflicts with an existing identity. Return to the employee and start again.')
      } else setError('The result is temporarily unavailable. Check again shortly.')
    } finally { busy.current = false; setPending(false) }
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
    {recoverable && <button disabled={pending} onClick={checkResult} className="border rounded-lg px-4 py-2 disabled:opacity-50">Check result</button>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <Link href="/employees" className="inline-block text-violet-700 underline">Return to employees</Link>
  </section>
}

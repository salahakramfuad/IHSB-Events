'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

function getBaseUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin
  return process.env.NEXT_PUBLIC_BASE_URL?.trim() || 'http://localhost:3000'
}

function doRedirect(url: string) {
  if (typeof window === 'undefined') return
  if (window.opener) {
    window.opener.location.replace(url)
    window.close()
  } else {
    window.location.replace(url)
  }
}

export default function BkashCallbackPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'cancelled'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)
  const [errorEventId, setErrorEventId] = useState<string | null>(null)
  const redirectedRef = useRef(false)

  const paymentID = searchParams.get('paymentID') ?? searchParams.get('paymentId')
  const statusParam = searchParams.get('status')

  useEffect(() => {
    if (!paymentID) {
      setStatus('error')
      setErrorMessage('Missing payment ID')
      return
    }

    if (statusParam === 'failure' || statusParam === 'cancel') {
      const baseUrl = getBaseUrl().replace(/\/$/, '')
      const paymentStatus = statusParam === 'cancel' ? 'cancelled' : 'failed'
      try {
        const eventId = sessionStorage.getItem('bkash_eventId')
        sessionStorage.removeItem('bkash_eventId')
        sessionStorage.removeItem('bkash_registrationData')
        doRedirect(eventId ? `${baseUrl}/${eventId}?payment=${paymentStatus}` : `${baseUrl}/?payment=${paymentStatus}`)
      } catch {
        doRedirect(`${baseUrl}/?payment=${paymentStatus}`)
      }
      return
    }

    if (statusParam !== 'success') {
      setStatus('error')
      setErrorMessage('Invalid callback status')
      return
    }

    const execute = async () => {
      try {
        let registrationData: Record<string, string> | null = null
        try {
          const stored = sessionStorage.getItem('bkash_registrationData')
          if (stored) registrationData = JSON.parse(stored) as Record<string, string>
        } catch {
          /* ignore */
        }
        if (!registrationData) {
          setStatus('error')
          setErrorMessage('Registration data not found. Please try registering again.')
          return
        }
        const res = await fetch('/api/bkash/execute-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentID, registrationData }),
        })
        const data = await res.json().catch(() => ({}))

        if (res.ok && data.success) {
          let eventId = data.eventId
          if (!eventId) {
            try {
              eventId = sessionStorage.getItem('bkash_eventId') ?? undefined
            } catch {
              /* ignore */
            }
          }
          try {
            sessionStorage.removeItem('bkash_eventId')
            sessionStorage.removeItem('bkash_registrationData')
          } catch {
            /* ignore */
          }
          const baseUrl = getBaseUrl().replace(/\/$/, '')
          const url = eventId
            ? `${baseUrl}/${eventId}?payment=success`
            : `${baseUrl}/?payment=success`
          setRedirectUrl(url)
          setStatus('success')

          if (!redirectedRef.current) {
            redirectedRef.current = true
            doRedirect(url)
          }
        } else {
          try {
            const eventId = sessionStorage.getItem('bkash_eventId')
            setErrorEventId(eventId)
            sessionStorage.removeItem('bkash_eventId')
            sessionStorage.removeItem('bkash_registrationData')
          } catch {
            /* ignore */
          }
          setStatus('error')
          setErrorMessage(data.error ?? data.errorCode ?? 'Payment could not be completed')
        }
      } catch {
        setStatus('error')
        setErrorMessage('Network error. Please try again.')
      }
    }

    execute()
  }, [paymentID, statusParam])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" aria-hidden />
        <p className="mt-4 text-slate-600">Completing your payment…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <XCircle className="mx-auto h-16 w-16 text-red-500" aria-hidden />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Payment Failed</h1>
          <p className="mt-2 text-slate-600">{errorMessage}</p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {errorEventId && (
              <Link
                href={`/${errorEventId}`}
                className="inline-block rounded-xl bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-500"
              >
                Try again
              </Link>
            )}
            <Link
              href="/"
              className="inline-block rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Back to events
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'cancelled') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
        <div className="rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto h-16 w-16 text-amber-500" aria-hidden />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Payment Cancelled</h1>
          <p className="mt-2 text-slate-600">You cancelled the payment. You can register again when ready.</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-500"
          >
            Back to events
          </Link>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (!redirectUrl) return
    const meta = document.createElement('meta')
    meta.httpEquiv = 'refresh'
    meta.content = `1;url=${redirectUrl}`
    document.head.appendChild(meta)
    return () => {
      if (meta.parentNode) meta.parentNode.removeChild(meta)
    }
  }, [redirectUrl])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm max-w-md">
        <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" aria-hidden />
        <h1 className="mt-4 text-xl font-semibold text-slate-900">Registration Complete!</h1>
        <p className="mt-2 text-slate-600">Redirecting you to the event page…</p>
        {redirectUrl && (
          <p className="mt-4 text-sm text-slate-500">
            If you are not redirected automatically,{' '}
            <Link href={redirectUrl} className="font-medium text-indigo-600 hover:text-indigo-700 underline">
              click here
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LogIn, ArrowRight } from 'lucide-react'

function AdminLoginFormInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/admin'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    void import('firebase/auth').then(() =>
      import('@/lib/firebase').then(({ getFirebaseAuth }) => getFirebaseAuth())
    )
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      const { getFirebaseAuth } = await import('@/lib/firebase')
      const authInstance = getFirebaseAuth()
      const userCred = await signInWithEmailAndPassword(
        authInstance,
        email.trim(),
        password
      )
      const idToken = await userCred.user.getIdToken()
      const assignRes = await fetch('/api/auth/assign-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })
      if (!assignRes.ok) {
        setError('Login succeeded but role assignment failed.')
        setLoading(false)
        return
      }
      const assignData = await assignRes.json().catch(() => ({}))
      const role = assignData?.role as string | undefined
      const freshToken = await userCred.user.getIdToken(true)
      const setCookieRes = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: freshToken,
          user: { uid: userCred.user.uid, email: userCred.user.email },
        }),
      })
      if (!setCookieRes.ok) {
        setError('Session could not be set.')
        setLoading(false)
        return
      }
      const isAdmin = role === 'admin' || role === 'superAdmin'
      if (!isAdmin) {
        setError(
          'This page is for administrators only. You have been signed in; redirecting to your dashboard.'
        )
        router.push('/dashboard')
        router.refresh()
        setLoading(false)
        return
      }
      const target = redirect.startsWith('/admin') ? redirect : '/admin'
      router.push(target)
      router.refresh()
    } catch (err: unknown) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code: string }).code)
          : ''
      const isInvalidCreds =
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-email'
      setError(
        isInvalidCreds
          ? 'Email or password is incorrect. Try again.'
          : err &&
              typeof err === 'object' &&
              'message' in err
            ? String((err as { message: string }).message)
            : 'Login failed'
      )
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition'

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-lg">
          <div className="mb-8 flex items-center justify-center gap-3">
            <Image
              src="/logo.png"
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 rounded-xl object-contain"
              priority
            />
            <span className="text-xl font-bold text-slate-900">IHSB Admin</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
            Admin sign in
          </h1>
          <p className="text-center text-slate-500 text-sm mb-6">
            Sign in to manage events and registrations.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="admin-password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-indigo-600"
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
              Student sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AdminLogin() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <div className="mx-auto mb-6 h-10 w-32 rounded-lg bg-slate-200 animate-pulse" />
            <div className="h-12 rounded-xl bg-slate-200 animate-pulse mb-4" />
            <div className="h-12 rounded-xl bg-slate-200 animate-pulse" />
          </div>
        </div>
      }
    >
      <AdminLoginFormInner />
    </Suspense>
  )
}


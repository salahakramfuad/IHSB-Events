'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Shield, Loader2, CheckCircle, AlertCircle, Lock } from 'lucide-react'
import SchoolCombobox from '@/components/SchoolCombobox'

type StudentProfile = {
  uid: string
  email: string
  role: string | null
  displayName: string | null
  school: string | null
  grade: string | null
  phone: string | null
  updatedAt: string | null
  signInProvider: string | null
}

const GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

export default function ProfileForm() {
  const router = useRouter()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState('')
  const [school, setSchool] = useState('')
  const [grade, setGrade] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    let isMounted = true
    fetch('/api/me/profile', { credentials: 'include' })
      .then((res) => {
        if (res.status === 401) {
          router.replace('/login?redirect=/dashboard/profile')
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (!isMounted) return
        if (data?.profile) {
          const p = data.profile as StudentProfile
          setProfile(p)
          setDisplayName(p.displayName ?? '')
          setSchool(p.school ?? '')
          setGrade(p.grade ?? '')
          setPhone(p.phone ?? '')
        }
      })
      .catch(() => {
        if (isMounted) setError('Failed to load profile.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => { isMounted = false }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaveSuccess(false)
    setSaving(true)
    try {
      const res = await fetch('/api/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          displayName: displayName.trim() || undefined,
          school: school.trim() || undefined,
          grade: grade.trim() || undefined,
          phone: phone.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Failed to update profile.')
        return
      }
      if (data.profile) setProfile(data.profile as StudentProfile)
      setSaveSuccess(true)
    } catch {
      setError('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const roleLabel =
    profile?.role === 'admin' || profile?.role === 'superAdmin'
      ? profile.role === 'superAdmin'
        ? 'Super Admin'
        : 'Admin'
      : 'Student'

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition'

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
        <span className="mt-3 text-sm">Loading profile…</span>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-2xl font-semibold text-indigo-700">
              {(profile.displayName || profile.email)?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Account</p>
              <p className="text-sm text-slate-500">{roleLabel}</p>
            </div>
          </div>
        </div>
        <dl className="divide-y divide-slate-100">
          <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
            <dt className="flex items-center gap-2 text-sm font-medium text-slate-500 sm:w-40">
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              Email
            </dt>
            <dd className="text-sm font-medium text-slate-900 sm:flex-1">
              {profile.email || '—'}
            </dd>
          </div>
          <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
            <dt className="flex items-center gap-2 text-sm font-medium text-slate-500 sm:w-40">
              <Shield className="h-4 w-4 shrink-0" aria-hidden />
              Role
            </dt>
            <dd className="text-sm font-medium text-slate-900 sm:flex-1">
              {roleLabel}
            </dd>
          </div>
          <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
            <dt className="flex items-center gap-2 text-sm font-medium text-slate-500 sm:w-40">
              <User className="h-4 w-4 shrink-0" aria-hidden />
              Account ID
            </dt>
            <dd className="font-mono text-xs text-slate-600 sm:flex-1 break-all">
              {profile.uid}
            </dd>
          </div>
        </dl>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900">Edit profile</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Update your name, school, grade, and phone.
          </p>
        </div>
        <div className="space-y-4 p-5 sm:p-6">
          <div>
            <label htmlFor="profile-displayName" className="mb-1.5 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="profile-displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inputClass}
              placeholder="Your full name"
            />
          </div>
          <div>
            <label htmlFor="profile-school" className="mb-1.5 block text-sm font-medium text-slate-700">
              School
            </label>
            <SchoolCombobox
              id="profile-school"
              value={school}
              onChange={setSchool}
              placeholder="Select or type school name"
            />
          </div>
          <div>
            <label htmlFor="profile-grade" className="mb-1.5 block text-sm font-medium text-slate-700">
              Grade
            </label>
            <select
              id="profile-grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className={inputClass}
            >
              <option value="">Select grade</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="profile-phone" className="mb-1.5 block text-sm font-medium text-slate-700">
              Phone <span className="text-slate-400">(optional)</span>
            </label>
            <input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder="01XXXXXXXXX"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
              {error}
            </div>
          )}
          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
              <CheckCircle className="h-4 w-4 shrink-0" aria-hidden />
              Profile updated.
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>

      {profile.signInProvider === 'password' ? (
        <ChangePasswordSection email={profile.email} />
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Lock className="h-5 w-5 text-slate-500" aria-hidden />
            Change password
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            You signed in with Google. To change your password, use your Google account settings.
          </p>
        </div>
      )}
    </div>
  )
}

function ChangePasswordSection({ email }: { email: string }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }
    setLoading(true)
    try {
      const { getFirebaseAuth } = await import('@/lib/firebase')
      const {
        reauthenticateWithCredential,
        EmailAuthProvider,
        updatePassword,
      } = await import('firebase/auth')
      const auth = getFirebaseAuth()
      const user = auth.currentUser
      if (!user) {
        setError('You must be signed in to change your password.')
        setLoading(false)
        return
      }
      const cred = EmailAuthProvider.credential(email, currentPassword)
      await reauthenticateWithCredential(user, cred)
      await updatePassword(user, newPassword)
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : ''
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        setError('Current password is incorrect.')
      } else {
        setError(err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Failed to update password.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Lock className="h-5 w-5 text-slate-500" aria-hidden />
          Change password
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Enter your current password and choose a new one. Only for email sign-in.
        </p>
      </div>
      <div className="space-y-4 p-5 sm:p-6">
        <div>
          <label htmlFor="current-password" className="mb-1.5 block text-sm font-medium text-slate-700">
            Current password
          </label>
          <input
            id="current-password"
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>
        <div>
          <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-slate-700">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-slate-700">
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
            <CheckCircle className="h-4 w-4 shrink-0" aria-hidden />
            Password updated.
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </div>
    </form>
  )
}

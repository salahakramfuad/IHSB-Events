'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { User, Upload, X, Lock, Pencil } from 'lucide-react'

type Profile = {
  uid: string
  email: string
  role: string
  displayName?: string
  photoURL?: string
}

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [photoURL, setPhotoURL] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/admin/me')
        if (!res.ok) {
          if (!cancelled) setError('Failed to load profile')
          return
        }
        const data = await res.json()
        if (!cancelled) {
          setProfile(data)
          setDisplayName(data.displayName ?? '')
          setPhotoURL(data.photoURL ?? '')
        }
      } catch {
        if (!cancelled) setError('Failed to load profile')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setSaving(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload-image', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.url) {
        const patchRes = await fetch('/api/admin/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoURL: data.url }),
        })
        if (patchRes.ok) {
          setPhotoURL(data.url)
          if (profile) setProfile({ ...profile, photoURL: data.url })
          setSuccess('Photo updated.')
        } else {
          setError('Failed to save photo.')
        }
      } else {
        setError(data.error ?? 'Upload failed')
      }
    } catch {
      setError('Upload failed')
    } finally {
      setSaving(false)
      e.target.value = ''
    }
  }

  const handleRemovePhoto = async () => {
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoURL: '' }),
      })
      if (res.ok) {
        setPhotoURL('')
        if (profile) setProfile({ ...profile, photoURL: undefined })
        setSuccess('Photo removed.')
      } else {
        setError('Failed to remove photo.')
      }
    } catch {
      setError('Failed to remove photo.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim() || undefined }),
      })
      if (res.ok) {
        if (profile) setProfile({ ...profile, displayName: displayName.trim() || undefined })
        setSuccess('Profile updated.')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to update profile.')
      }
    } catch {
      setError('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setPasswordSaving(true)
    try {
      const res = await fetch('/api/admin/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })
      if (res.ok) {
        setNewPassword('')
        setConfirmPassword('')
        setSuccess('Password updated.')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to update password.')
      }
    } catch {
      setError('Failed to update password.')
    } finally {
      setPasswordSaving(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition'

  const displayLabel = profile?.displayName?.trim() || profile?.email?.split('@')[0] || ''

  if (loading || !profile) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <div className="mt-6 h-48 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Edit
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditing(false)
              setDisplayName(profile.displayName ?? '')
              setPhotoURL(profile.photoURL ?? '')
              setNewPassword('')
              setConfirmPassword('')
              setError('')
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </div>

      {error && (
        <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {!editing ? (
        /* View mode: photo, name, email only */
        <section className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-6">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100">
              {photoURL ? (
                <Image
                  src={photoURL}
                  alt="Profile"
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <User className="h-12 w-12" aria-hidden />
                </div>
              )}
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">{displayLabel}</p>
              <p className="text-sm text-slate-500">{profile.email}</p>
            </div>
          </div>
        </section>
      ) : (
        /* Edit mode: photo, name, password forms */
        <>
          {/* Photo */}
          <section className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <User className="h-5 w-5" aria-hidden />
              Photo
            </h2>
            <div className="flex flex-wrap items-center gap-6">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100">
                {photoURL ? (
                  <>
                    <Image
                      src={photoURL}
                      alt="Profile"
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={saving}
                      className="absolute right-0 top-0 rounded-full bg-slate-900/60 p-1 text-white hover:bg-slate-900 disabled:opacity-50"
                      aria-label="Remove photo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <User className="h-12 w-12" aria-hidden />
                  </div>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handlePhotoChange}
                  className="sr-only"
                  id="profile-photo"
                  aria-label="Upload photo"
                />
                <label
                  htmlFor="profile-photo"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" aria-hidden />
                  {saving ? 'Uploading…' : photoURL ? 'Change photo' : 'Upload photo'}
                </label>
              </div>
            </div>
          </section>

          {/* Name */}
          <section className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Display name</h2>
            <form onSubmit={handleSaveProfile} className="flex flex-wrap items-end gap-4">
              <div className="min-w-[200px] flex-1">
                <label htmlFor="displayName" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={inputClass}
                  placeholder="Your name"
                />
              </div>
              <p className="text-sm text-slate-500">Email: {profile.email}</p>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save name'}
              </button>
            </form>
          </section>

          {/* Password */}
          <section className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Lock className="h-5 w-5" aria-hidden />
              Change password
            </h2>
            <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
              <div>
                <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-slate-700">
                  New password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Confirm new password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                disabled={passwordSaving || !newPassword || newPassword !== confirmPassword}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {passwordSaving ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </section>
        </>
      )}
    </div>
  )
}

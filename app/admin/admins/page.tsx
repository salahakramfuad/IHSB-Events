'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  Key,
  Pencil,
  Trash2,
  User,
  X,
  Shield,
  ShieldCheck,
} from 'lucide-react'

type AdminProfile = {
  uid: string
  email: string
  role: string
  displayName?: string
  photoURL?: string
}

export default function AdminAdminsPage() {
  const [list, setList] = useState<AdminProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [addEmail, setAddEmail] = useState('')
  const [addPassword, setAddPassword] = useState('')
  const [addName, setAddName] = useState('')
  const [addSaving, setAddSaving] = useState(false)
  const [resetUid, setResetUid] = useState<string | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetSaving, setResetSaving] = useState(false)
  const [editUid, setEditUid] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhotoURL, setEditPhotoURL] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [deleteUid, setDeleteUid] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteSaving, setDeleteSaving] = useState(false)

  const loadAdmins = async () => {
    try {
      const res = await fetch('/api/admin/admins')
      if (res.status === 403) {
        setError('You do not have permission to view admins.')
        setList([])
        return
      }
      if (!res.ok) {
        setError('Failed to load admins.')
        return
      }
      const data = await res.json()
      setList(data)
      setError('')
    } catch {
      setError('Failed to load admins.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdmins()
  }, [])

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addEmail.trim() || addPassword.length < 6) {
      setError('Email and password (min 6 characters) are required.')
      return
    }
    setError('')
    setSuccess('')
    setAddSaving(true)
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: addEmail.trim().toLowerCase(),
          password: addPassword,
          displayName: addName.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setAddOpen(false)
        setAddEmail('')
        setAddPassword('')
        setAddName('')
        setSuccess('Admin created. They can sign in with the email and password you set.')
        loadAdmins()
      } else {
        setError(data.error ?? 'Failed to create admin.')
      }
    } catch {
      setError('Failed to create admin.')
    } finally {
      setAddSaving(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetUid || resetPassword.length < 6) return
    setError('')
    setResetSaving(true)
    try {
      const res = await fetch(`/api/admin/admins/${resetUid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPassword }),
      })
      if (res.ok) {
        setResetUid(null)
        setResetPassword('')
        setSuccess('Password reset.')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to reset password.')
      }
    } catch {
      setError('Failed to reset password.')
    } finally {
      setResetSaving(false)
    }
  }

  const openEdit = (admin: AdminProfile) => {
    setEditUid(admin.uid)
    setEditName(admin.displayName ?? '')
    setEditPhotoURL(admin.photoURL ?? '')
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUid) return
    setError('')
    setEditSaving(true)
    try {
      const res = await fetch(`/api/admin/admins/${editUid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: editName.trim() || undefined,
          photoURL: editPhotoURL.trim() || undefined,
        }),
      })
      if (res.ok) {
        setEditUid(null)
        setSuccess('Admin updated.')
        loadAdmins()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to update admin.')
      }
    } catch {
      setError('Failed to update admin.')
    } finally {
      setEditSaving(false)
    }
  }

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deleteUid || deleteConfirm !== 'DELETE') return
    setError('')
    setDeleteSaving(true)
    try {
      const res = await fetch(`/api/admin/admins/${deleteUid}`, { method: 'DELETE' })
      if (res.ok) {
        setDeleteUid(null)
        setDeleteConfirm('')
        setSuccess('Admin removed.')
        loadAdmins()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to delete admin.')
      }
    } catch {
      setError('Failed to delete admin.')
    } finally {
      setDeleteSaving(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition'

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Admins</h1>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add admin
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-slate-500">Loading…</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Admin
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Role
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {list.map((admin) => (
                <tr key={admin.uid} className="transition hover:bg-slate-50/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100">
                        {admin.photoURL ? (
                          <img
                            src={admin.photoURL}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <User className="h-5 w-5" aria-hidden />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {admin.displayName || admin.email}
                        </p>
                        <p className="text-sm text-slate-500">{admin.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        admin.role === 'superAdmin'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {admin.role === 'superAdmin' ? (
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                      ) : (
                        <Shield className="h-3.5 w-3.5" aria-hidden />
                      )}
                      {admin.role === 'superAdmin' ? 'Super Admin' : 'Admin'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setResetUid(admin.uid)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                        title="Reset password"
                      >
                        <Key className="h-4 w-4" aria-hidden />
                        Reset password
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(admin)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                        title="Edit profile"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteUid(admin.uid)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        title="Delete admin"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && list.length === 0 && (
          <div className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-300" aria-hidden />
            <p className="mt-4 text-slate-500">No admins found.</p>
          </div>
        )}
      </div>

      {/* Add admin modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Add admin</h2>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className={inputClass}
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Display name (optional)
                </label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className={inputClass}
                  placeholder="John Doe"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={addSaving}
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {addSaving ? 'Creating…' : 'Create admin'}
                </button>
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetUid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Reset password</h2>
              <button
                type="button"
                onClick={() => { setResetUid(null); setResetPassword('') }}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  New password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={resetSaving}
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {resetSaving ? 'Resetting…' : 'Reset password'}
                </button>
                <button
                  type="button"
                  onClick={() => { setResetUid(null); setResetPassword('') }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit admin modal */}
      {editUid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Edit admin</h2>
              <button
                type="button"
                onClick={() => setEditUid(null)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Display name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={inputClass}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Photo URL
                </label>
                <input
                  type="url"
                  value={editPhotoURL}
                  onChange={(e) => setEditPhotoURL(e.target.value)}
                  className={inputClass}
                  placeholder="https://..."
                />
                <p className="mt-1 text-xs text-slate-500">
                  Upload an image elsewhere and paste the URL, or leave empty.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={editSaving}
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {editSaving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditUid(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteUid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Delete admin</h2>
              <button
                type="button"
                onClick={() => { setDeleteUid(null); setDeleteConfirm('') }}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-slate-600">
              This will remove the admin from the system. They will no longer be able to sign in.
              Type <strong>DELETE</strong> to confirm.
            </p>
            <form onSubmit={handleDelete} className="space-y-4">
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className={inputClass}
                placeholder="DELETE"
                autoComplete="off"
              />
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={deleteSaving || deleteConfirm !== 'DELETE'}
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-red-500 disabled:opacity-50"
                >
                  {deleteSaving ? 'Deleting…' : 'Delete admin'}
                </button>
                <button
                  type="button"
                  onClick={() => { setDeleteUid(null); setDeleteConfirm('') }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

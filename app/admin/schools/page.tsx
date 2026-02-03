'use client'

import { useState, useEffect } from 'react'
import { Building2, Plus, Pencil, Trash2, X, Search } from 'lucide-react'

type School = {
  id: string
  name: string
  createdAt: string
}

export default function AdminSchoolsPage() {
  const [list, setList] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addSaving, setAddSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteSaving, setDeleteSaving] = useState(false)

  const loadSchools = async () => {
    try {
      const res = await fetch('/api/schools')
      if (!res.ok) {
        setError('Failed to load schools.')
        return
      }
      const data = await res.json()
      setList(data)
      setError('')
    } catch {
      setError('Failed to load schools.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSchools()
  }, [])

  const filtered = list.filter((s) =>
    s.name.toLowerCase().includes(search.trim().toLowerCase())
  )

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addName.trim()) {
      setError('School name is required.')
      return
    }
    setError('')
    setSuccess('')
    setAddSaving(true)
    try {
      const res = await fetch('/api/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addName.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setAddOpen(false)
        setAddName('')
        setSuccess('School added.')
        loadSchools()
      } else {
        setError(data.error ?? 'Failed to add school.')
      }
    } catch {
      setError('Failed to add school.')
    } finally {
      setAddSaving(false)
    }
  }

  const openEdit = (school: School) => {
    setEditId(school.id)
    setEditName(school.name)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editId || !editName.trim()) return
    setError('')
    setEditSaving(true)
    try {
      const res = await fetch(`/api/schools/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setEditId(null)
        setSuccess('School updated.')
        loadSchools()
      } else {
        setError(data.error ?? 'Failed to update school.')
      }
    } catch {
      setError('Failed to update school.')
    } finally {
      setEditSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setError('')
    setDeleteSaving(true)
    try {
      const res = await fetch(`/api/schools/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        setDeleteId(null)
        setSuccess('School deleted.')
        loadSchools()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to delete school.')
      }
    } catch {
      setError('Failed to delete school.')
    } finally {
      setDeleteSaving(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition'

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Schools</h1>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add school
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

      <div className="mb-4">
        <label htmlFor="school-search" className="sr-only">
          Search schools
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            id="school-search"
            type="search"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-slate-500">Loading…</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  School name
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((school) => (
                <tr key={school.id} className="transition hover:bg-slate-50/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
                      <span className="font-medium text-slate-900">{school.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(school)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                        title="Edit school"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(school.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        title="Delete school"
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
        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center">
            <Building2 className="mx-auto h-12 w-12 text-slate-300" aria-hidden />
            <p className="mt-4 text-slate-500">
              {list.length === 0 ? 'No schools yet. Add one to get started.' : 'No schools match your search.'}
            </p>
          </div>
        )}
      </div>

      {/* Add school modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Add school</h2>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">School name</label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. ABC High School"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={addSaving}
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {addSaving ? 'Adding…' : 'Add school'}
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

      {/* Edit school modal */}
      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Edit school</h2>
              <button
                type="button"
                onClick={() => setEditId(null)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">School name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. ABC High School"
                />
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
                  onClick={() => setEditId(null)}
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
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Delete school</h2>
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-slate-600">
              Are you sure you want to delete this school? Existing registrations will keep the school name
              as stored, but the school will no longer appear in the dropdown for new registrations.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteSaving}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-red-500 disabled:opacity-50"
              >
                {deleteSaving ? 'Deleting…' : 'Delete'}
              </button>
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

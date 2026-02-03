'use client'

import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { Building2, Plus, Pencil, Trash2, X, Search, Users, Award, Calendar } from 'lucide-react'

type School = {
  id: string
  name: string
  createdAt: string
  participants?: number
  winners?: number
}

type EventOption = {
  id: string
  title: string
}

export default function AdminSchoolsPage() {
  const [list, setList] = useState<School[]>([])
  const [events, setEvents] = useState<EventOption[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
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

  const loadEvents = async () => {
    try {
      const res = await fetch('/api/admin/events')
      if (res.ok) {
        const data = await res.json()
        setEvents(data)
      }
    } catch {
      // ignore
    }
  }

  const loadSchools = async () => {
    try {
      const params = new URLSearchParams({ stats: '1' })
      if (selectedEventId) params.set('eventId', selectedEventId)
      const res = await fetch(`/api/schools?${params}`)
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
    loadEvents()
  }, [])

  useEffect(() => {
    setLoading(true)
    loadSchools()
  }, [selectedEventId])

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

  const totalParticipants = list.reduce((s, x) => s + (x.participants ?? 0), 0)
  const totalWinners = list.reduce((s, x) => s + (x.winners ?? 0), 0)

  const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
  const circumference = 2 * Math.PI * 40

  const registrationsBySchool = list
    .filter((s) => (s.participants ?? 0) > 0)
    .map((s, i) => ({ name: s.name, value: s.participants ?? 0, color: PIE_COLORS[i % PIE_COLORS.length] }))
  const winnersBySchool = list
    .filter((s) => (s.winners ?? 0) > 0)
    .map((s, i) => ({ name: s.name, value: s.winners ?? 0, color: PIE_COLORS[i % PIE_COLORS.length] }))

  const renderPieChart = (data: { name: string; value: number; color: string }[], total: number) => {
    if (data.length === 0 || total === 0) return null
    return (
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <div className="relative h-48 w-48">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            {data.reduce<{ offset: number; elements: ReactNode[] }>(
              (acc, d, i) => {
                const segmentLength = (d.value / total) * circumference
                const dashArray = `${segmentLength} ${circumference}`
                const dashOffset = -acc.offset
                const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0'
                acc.offset += segmentLength
                acc.elements.push(
                  <g key={i} style={{ cursor: 'pointer' }}>
                    <title>{`${d.name}: ${d.value} (${pct}%)`}</title>
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={d.color}
                      strokeWidth="20"
                      strokeDasharray={dashArray}
                      strokeDashoffset={dashOffset}
                    />
                  </g>
                )
                return acc
              },
              { offset: 0, elements: [] }
            ).elements}
          </svg>
        </div>
        <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
          {data.map((d, i) => {
            const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0'
            const tooltip = `${d.name}: ${d.value} (${pct}% of total)`
            return (
              <div
                key={i}
                className="flex cursor-help items-center gap-2 text-sm"
                title={tooltip}
              >
                <span
                  className="h-3.5 w-3.5 shrink-0 rounded"
                  style={{ backgroundColor: d.color }}
                  aria-hidden
                />
                <span className="truncate text-slate-700">
                  {d.name}: {d.value}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

      <div className="mb-8 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <Calendar className="h-5 w-5 text-slate-500" aria-hidden />
        <label htmlFor="event-filter" className="text-sm font-medium text-slate-700">
          View stats by event
        </label>
        <select
          id="event-filter"
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="min-w-[200px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All events</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title}
            </option>
          ))}
        </select>
        {selectedEventId && (
          <span className="text-sm text-slate-500">
            Showing stats for selected event only
          </span>
        )}
      </div>

      {!loading && (
        <>
          <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div
              className="cursor-help rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-slate-300"
              title="Number of schools registered in the system. Students can select from this list when registering for events."
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Building2 className="h-5 w-5" aria-hidden />
              </div>
              <p className="text-sm font-medium text-slate-500">Total schools</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{list.length}</p>
            </div>
            <div
              className="cursor-help rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-slate-300"
              title={selectedEventId ? 'Registrations for the selected event.' : 'Total event registrations across all events. Each student can register for multiple events.'}
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <Users className="h-5 w-5" aria-hidden />
              </div>
              <p className="text-sm font-medium text-slate-500">
                {selectedEventId ? 'Participants (this event)' : 'Total participants'}
              </p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{totalParticipants}</p>
            </div>
            <div
              className="cursor-help rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-slate-300"
              title={selectedEventId ? 'Winners (1st–20th) in the selected event.' : 'Participants who secured 1st–20th position in any event. Winners are featured in event results.'}
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <Award className="h-5 w-5" aria-hidden />
              </div>
              <p className="text-sm font-medium text-slate-500">
                {selectedEventId ? 'Winners (this event)' : 'Total winners'}
              </p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{totalWinners}</p>
            </div>
          </div>

          <div className="mb-8 grid gap-8 lg:grid-cols-2">
            <div
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
              title="Distribution of event registrations across schools. Hover over segments or legend for details."
            >
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                {selectedEventId ? 'Registrations by school (this event)' : 'Registrations by school'}
              </h3>
              {renderPieChart(registrationsBySchool, totalParticipants) ?? (
                <p className="py-8 text-center text-sm text-slate-500">No registration data yet.</p>
              )}
            </div>
            <div
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
              title="Distribution of winners (1st–20th) across schools. Hover over segments or legend for details."
            >
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                {selectedEventId ? 'Winners by school (this event)' : 'Winners by school'}
              </h3>
              {renderPieChart(winnersBySchool, totalWinners) ?? (
                <p className="py-8 text-center text-sm text-slate-500">No winner data yet.</p>
              )}
            </div>
          </div>
        </>
      )}

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
                  Participants
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Winners
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
                  <td className="px-5 py-4 text-right text-slate-600">
                    {school.participants ?? 0}
                  </td>
                  <td className="px-5 py-4 text-right text-slate-600">
                    {school.winners ?? 0}
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

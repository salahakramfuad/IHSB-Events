'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Calendar, Pencil, Trash2, Users } from 'lucide-react'
import {
  formatEventDates,
  parseEventDates,
  isEventUpcoming,
  getFirstEventDate,
  getLastEventDate,
} from '@/lib/dateUtils'
import type { Event } from '@/types/event'
import DeleteEventButton from './DeleteEventButton'

function matchSearch(event: Event, q: string, createdByName?: string): boolean {
  if (!q.trim()) return true
  const lower = q.trim().toLowerCase()
  const title = (event.title ?? '').toLowerCase()
  const venue = (event.venue ?? event.location ?? '').toLowerCase()
  const location = (event.location ?? '').toLowerCase()
  const createdBy = (createdByName ?? '').toLowerCase()
  return (
    title.includes(lower) ||
    venue.includes(lower) ||
    location.includes(lower) ||
    createdBy.includes(lower)
  )
}

interface EventsTableWithSearchProps {
  events: Event[]
  profile: { uid: string; role: string } | null
}

export default function EventsTableWithSearch({ events, profile }: EventsTableWithSearchProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const matches = events.filter((e) => matchSearch(e, search, e.createdByName))
    return [...matches].sort((a, b) => {
      const aUpcoming = isEventUpcoming(a.date)
      const bUpcoming = isEventUpcoming(b.date)
      if (aUpcoming && !bUpcoming) return -1
      if (!aUpcoming && bUpcoming) return 1
      if (aUpcoming && bUpcoming) {
        const dA = getFirstEventDate(a.date)?.getTime() ?? Infinity
        const dB = getFirstEventDate(b.date)?.getTime() ?? Infinity
        return dA - dB
      }
      const dA = getLastEventDate(a.date)?.getTime() ?? 0
      const dB = getLastEventDate(b.date)?.getTime() ?? 0
      return dB - dA
    })
  }, [events, search])

  return (
    <>
      <div className="mb-6">
        <label htmlFor="events-search" className="sr-only">
          Search events
        </label>
        <div className="relative max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            id="events-search"
            type="search"
            placeholder="Search by title, venue, or creator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        {search.trim() && (
          <p className="mt-1.5 text-xs text-slate-500">
            Showing {filtered.length} of {events.length} events
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Title
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Date
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Venue
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Created by
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map((event) => {
              const dates = parseEventDates(event.date)
              const dateStr = dates.length > 0 ? formatEventDates(dates, 'short') : 'TBA'
              const venue = event.venue || event.location || 'TBA'
              const upcoming = isEventUpcoming(event.date)
              const canEdit =
                profile?.role === 'superAdmin' || event.createdBy === profile?.uid
              return (
                <tr key={event.id} className="transition hover:bg-slate-50/50">
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="text-sm font-medium text-slate-900 hover:text-indigo-600 hover:underline"
                    >
                      {event.title}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{dateStr}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{venue}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {event.createdByName || '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        upcoming ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {upcoming ? 'Upcoming' : 'Past'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                      >
                        <Users className="h-4 w-4" aria-hidden />
                        View
                      </Link>
                      {canEdit && (
                        <>
                          <Link
                            href={`/admin/events/${event.id}/edit`}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                            Edit
                          </Link>
                          <DeleteEventButton eventId={event.id} eventTitle={event.title} />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Calendar className="mx-auto h-12 w-12 text-slate-300" aria-hidden />
            <p className="mt-4 text-slate-500">
              {search.trim() ? 'No events match your search.' : 'No events yet. Create your first event.'}
            </p>
            {!search.trim() && (
              <Link
                href="/admin/events/new"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Create event
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  )
}

import Link from 'next/link'
import { getAdminEvents, getCurrentAdminProfileInServer } from '@/app/admin/actions'
import { formatEventDates, parseEventDates, isEventUpcoming } from '@/lib/dateUtils'
import { Calendar, Pencil, Trash2, Users, Plus } from 'lucide-react'
import DeleteEventButton from './DeleteEventButton'

export default async function AdminEventsPage() {
  const [events, profile] = await Promise.all([
    getAdminEvents(),
    getCurrentAdminProfileInServer(),
  ])

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Events</h1>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Create event
        </Link>
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
            {events.map((event) => {
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
        {events.length === 0 && (
          <div className="py-16 text-center">
            <Calendar className="mx-auto h-12 w-12 text-slate-300" aria-hidden />
            <p className="mt-4 text-slate-500">No events yet. Create your first event.</p>
            <Link
              href="/admin/events/new"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Create event
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

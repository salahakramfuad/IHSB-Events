import Link from 'next/link'
import Image from 'next/image'
import { getAdminEvent, getEventRegistrations, getCurrentAdminProfileInServer } from '@/app/admin/actions'
import ExportRegistrationsButton from './registrations/ExportRegistrationsButton'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Pencil,
  User,
} from 'lucide-react'
import { parseEventDates, formatEventDates, isEventUpcoming } from '@/lib/dateUtils'

export default async function AdminEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [event, registrations, profile] = await Promise.all([
    getAdminEvent(id),
    getEventRegistrations(id),
    getCurrentAdminProfileInServer(),
  ])
  if (!event) notFound()

  const canEdit =
    profile?.role === 'superAdmin' || event.createdBy === profile?.uid
  const dates = parseEventDates(event.date)
  const dateStr = dates.length > 0 ? formatEventDates(dates, 'long') : 'TBA'
  const venue = event.venue || event.location || 'TBA'
  const upcoming = isEventUpcoming(event.date)
  const hasImage = event.image?.trim() && (event.image.startsWith('http') || event.image.startsWith('/'))

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Events
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{event.title}</h1>
        </div>
        {canEdit && (
          <Link
            href={`/admin/events/${id}/edit`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Edit event
          </Link>
        )}
      </div>

      {/* Event details */}
      <section className="mb-10 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {hasImage && (
          <div className="relative aspect-[21/9] w-full overflow-hidden bg-slate-100">
            <Image
              src={event.image!}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          </div>
        )}
        <div className="p-6 sm:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                upcoming ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {upcoming ? 'Upcoming' : 'Past'}
            </span>
          </div>
          <p className="mb-4 text-slate-600">{event.description}</p>
          <p className="mb-6 flex items-center gap-2 text-sm text-slate-500">
            <User className="h-4 w-4 shrink-0" aria-hidden />
            Created by {event.createdByName || '—'}
          </p>
          {event.fullDescription && (
            <div className="mb-6 rounded-xl bg-slate-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Full description</h3>
              <p className="whitespace-pre-wrap text-sm text-slate-600">{event.fullDescription}</p>
            </div>
          )}
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Date</dt>
                <dd className="text-slate-900">{dateStr}</dd>
              </div>
            </div>
            {event.time && (
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Time</dt>
                  <dd className="text-slate-900">{event.time}</dd>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 sm:col-span-2">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Location / Venue
                </dt>
                <dd className="text-slate-900">{venue}</dd>
              </div>
            </div>
          </dl>
        </div>
      </section>

      {/* Registration stats */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Registrations</h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-6 py-4 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Users className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{registrations.length}</p>
              <p className="text-sm text-slate-500">Total registrations</p>
            </div>
          </div>
          <ExportRegistrationsButton
            eventId={id}
            eventTitle={event.title}
            registrations={registrations}
          />
        </div>
      </section>

      {/* Registration list */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-700">Registration list</h3>
        </div>
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Name
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Email
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Phone
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                School
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Note
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Registered
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {registrations.map((reg) => (
              <tr key={reg.id} className="transition hover:bg-slate-50/50">
                <td className="px-5 py-4 text-sm font-medium text-slate-900">{reg.name}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{reg.email}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{reg.phone}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{reg.school}</td>
                <td className="max-w-xs truncate px-5 py-4 text-sm text-slate-600">
                  {reg.note ?? '—'}
                </td>
                <td className="px-5 py-4 text-sm text-slate-500">
                  {typeof reg.createdAt === 'string'
                    ? format(new Date(reg.createdAt), 'PPp')
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {registrations.length === 0 && (
          <div className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-300" aria-hidden />
            <p className="mt-4 text-slate-500">No registrations yet.</p>
          </div>
        )}
      </section>
    </div>
  )
}

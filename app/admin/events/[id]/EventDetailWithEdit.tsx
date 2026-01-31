'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Pencil,
  User,
  X,
} from 'lucide-react'
import type { Event } from '@/types/event'
import type { Registration } from '@/types/registration'
import EventLogo from '@/components/EventLogo'
import { parseEventDates, formatEventDates, isEventUpcoming } from '@/lib/dateUtils'
import ExportRegistrationsButton from './registrations/ExportRegistrationsButton'
import RegistrationsTableWithSearch from './registrations/RegistrationsTableWithSearch'
import EventForm from '../EventForm'

interface EventDetailWithEditProps {
  event: Event
  registrations: Registration[]
  canEdit: boolean
  isSuperAdmin: boolean
}

export default function EventDetailWithEdit({
  event,
  registrations,
  canEdit,
  isSuperAdmin,
}: EventDetailWithEditProps) {
  const [isEditing, setIsEditing] = useState(false)

  const dates = parseEventDates(event.date)
  const dateStr = dates.length > 0 ? formatEventDates(dates, 'long') : 'TBA'
  const venue = event.venue || event.location || 'TBA'
  const upcoming = isEventUpcoming(event.date)
  const hasImage =
    event.image?.trim() &&
    (event.image.startsWith('http') || event.image.startsWith('/'))

  if (isEditing) {
    return (
      <div>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin/events"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Events
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Edit: {event.title}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <X className="h-4 w-4" aria-hidden />
            Cancel editing
          </button>
        </div>
        <EventForm event={event} />
      </div>
    )
  }

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
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Edit event
          </button>
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
            <div className="absolute left-6 top-6">
              <EventLogo title={event.title} logo={event.logo} size="md" className="shadow-lg" />
            </div>
          </div>
        )}
        <div className="p-6 sm:p-8">
          {!hasImage && (
            <div className="mb-6">
              <EventLogo title={event.title} logo={event.logo} size="lg" />
            </div>
          )}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                upcoming
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {upcoming ? 'Upcoming' : 'Past'}
            </span>
            {event.categories && event.categories.length > 0 && (
              <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                {event.categories.length} {event.categories.length === 1 ? 'category' : 'categories'}
              </span>
            )}
          </div>
          <p className="mb-4 text-slate-600">{event.description}</p>
          <p className="mb-6 flex items-center gap-2 text-sm text-slate-500">
            <User className="h-4 w-4 shrink-0" aria-hidden />
            Created by {event.createdByName || '—'}
          </p>
          {event.fullDescription && (
            <div className="mb-6 rounded-xl bg-slate-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">
                Full description
              </h3>
              <p className="whitespace-pre-wrap text-sm text-slate-600">
                {event.fullDescription}
              </p>
            </div>
          )}
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Calendar
                className="mt-0.5 h-5 w-5 shrink-0 text-slate-400"
                aria-hidden
              />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Date
                </dt>
                <dd className="text-slate-900">{dateStr}</dd>
              </div>
            </div>
            {event.time && (
              <div className="flex items-start gap-3">
                <Clock
                  className="mt-0.5 h-5 w-5 shrink-0 text-slate-400"
                  aria-hidden
                />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Time
                  </dt>
                  <dd className="text-slate-900">{event.time}</dd>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 sm:col-span-2">
              <MapPin
                className="mt-0.5 h-5 w-5 shrink-0 text-slate-400"
                aria-hidden
              />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Location / Venue
                </dt>
                <dd className="text-slate-900">{venue}</dd>
              </div>
            </div>
          </dl>
          {event.categories && event.categories.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {event.categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}
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
              <p className="text-2xl font-bold text-slate-900">
                {registrations.length}
              </p>
              <p className="text-sm text-slate-500">Total registrations</p>
            </div>
          </div>
          <ExportRegistrationsButton
            eventId={event.id}
            eventTitle={event.title}
            registrations={registrations}
          />
        </div>
      </section>

      {/* Registration list with search and position assignment */}
      <section>
        <RegistrationsTableWithSearch
          eventId={event.id}
          eventTitle={event.title}
          registrations={registrations}
          canEdit={canEdit}
          isSuperAdmin={isSuperAdmin}
          eventCategories={event.categories}
        />
      </section>
    </div>
  )
}

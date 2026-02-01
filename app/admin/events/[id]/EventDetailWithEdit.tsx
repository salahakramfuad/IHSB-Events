'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  ChevronDown,
  ChevronUp,
  Trophy,
  Award,
  Send,
  CheckCircle,
  Hash,
} from 'lucide-react'
import type { Event } from '@/types/event'
import type { Registration } from '@/types/registration'
import EventLogo from '@/components/EventLogo'
import { parseEventDates, formatEventDates, isEventUpcoming } from '@/lib/dateUtils'
import ExportRegistrationsButton from './registrations/ExportRegistrationsButton'
import RegistrationsTableWithSearch from './registrations/RegistrationsTableWithSearch'
import EventForm from '../EventForm'
import { notifySingleAwardee } from '@/app/admin/actions'

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
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true)
  const [notifyModal, setNotifyModal] = useState<Registration | null>(null)
  const [notifyLoading, setNotifyLoading] = useState(false)

  const dates = parseEventDates(event.date)
  const dateStr = dates.length > 0 ? formatEventDates(dates, 'long') : 'TBA'
  const venue = event.venue || event.location || 'TBA'
  const upcoming = isEventUpcoming(event.date)
  const hasImage =
    event.image?.trim() &&
    (event.image.startsWith('http') || event.image.startsWith('/'))

  const winners = registrations
    .filter((r) => r.position != null && r.position >= 1 && r.position <= 20)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

  const positionLabel = (n: number) =>
    n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`

  const getPositionColor = (position: number) => {
    if (position === 1) return 'bg-gradient-to-br from-yellow-50 to-amber-100 border-amber-200'
    if (position === 2) return 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300'
    if (position === 3) return 'bg-gradient-to-br from-orange-50 to-amber-50 border-amber-200'
    return 'bg-white border-slate-200'
  }

  const handleNotifyClick = (winner: Registration) => {
    setNotifyModal(winner)
  }

  const handleNotifyConfirm = async () => {
    if (!notifyModal) return
    setNotifyLoading(true)
    try {
      const result = await notifySingleAwardee(event.id, notifyModal.id)
      if (result.success) {
        setNotifyModal(null)
        router.refresh()
      } else {
        alert(result.error ?? 'Failed to send notification.')
      }
    } finally {
      setNotifyLoading(false)
    }
  }

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
        <button
          type="button"
          onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
          className="flex w-full items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-3 text-left transition hover:bg-slate-100"
        >
          <h2 className="text-sm font-semibold text-slate-700">Event Details</h2>
          {isDetailsExpanded ? (
            <ChevronUp className="h-5 w-5 text-slate-400" aria-hidden />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" aria-hidden />
          )}
        </button>
        {isDetailsExpanded ? (
          <>
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
        </>
        ) : (
          <div className="p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                {dateStr}
              </span>
              {event.time && (
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  {event.time}
                </span>
              )}
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                {venue}
              </span>
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                {registrations.length} registration{registrations.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Winners section */}
      {winners.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" aria-hidden />
            <h2 className="text-lg font-semibold text-slate-900">Winners</h2>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              {winners.length}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {winners.map((winner) => (
              <div
                key={winner.id}
                className={`overflow-hidden rounded-xl border shadow-sm transition hover:shadow-md ${getPositionColor(winner.position!)}`}
              >
                <div className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Award
                        className={`h-5 w-5 shrink-0 ${
                          winner.position === 1
                            ? 'text-amber-500'
                            : winner.position === 2
                              ? 'text-slate-500'
                              : winner.position === 3
                                ? 'text-orange-600'
                                : 'text-slate-400'
                        }`}
                        aria-hidden
                      />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {positionLabel(winner.position!)}
                      </span>
                    </div>
                  </div>
                  <h3 className="mb-1 font-semibold text-slate-900">{winner.name}</h3>
                  <p className="text-sm text-slate-600">{winner.school}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                    <Hash className="h-3 w-3" aria-hidden />
                    <span>{winner.registrationId || winner.id}</span>
                  </div>
                  {winner.category && (
                    <span className="mt-2 inline-flex rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                      {winner.category}
                    </span>
                  )}
                  {canEdit && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60">
                      {winner.resultNotifiedAt ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                          <CheckCircle className="h-3.5 w-3.5" aria-hidden />
                          <span>Notified</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleNotifyClick(winner)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700"
                        >
                          <Send className="h-3.5 w-3.5" aria-hidden />
                          Publish
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Notify modal */}
      {notifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-slate-900">
              Publish result for {notifyModal.name}?
            </h3>
            <p className="mb-6 text-sm text-slate-600">
              This will send an email notification to {notifyModal.email} informing them of their{' '}
              {positionLabel(notifyModal.position!)} place position in {event.title}.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setNotifyModal(null)}
                disabled={notifyLoading}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNotifyConfirm}
                disabled={notifyLoading}
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {notifyLoading ? 'Sending...' : 'Send notification'}
              </button>
            </div>
          </div>
        </div>
      )}

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

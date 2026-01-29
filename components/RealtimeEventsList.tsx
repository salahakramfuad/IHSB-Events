'use client'

import Link from 'next/link'
import { Calendar, MapPin, ArrowRight } from 'lucide-react'
import type { Event } from '@/types/event'
import { isEventUpcoming } from '@/lib/dateUtils'
import { parseEventDates, formatEventDates } from '@/lib/dateUtils'

function EventCard({ event }: { event: Event }) {
  const upcoming = isEventUpcoming(event.date)
  const dates = parseEventDates(event.date)
  const dateStr = dates.length > 0 ? formatEventDates(dates, 'short') : 'TBA'
  const venue = event.venue || event.location || 'TBA'
  const hasImage = event.image?.trim() && (event.image.startsWith('http') || event.image.startsWith('/'))

  return (
    <Link
      href={`/${event.id}`}
      className="group block overflow-hidden rounded-2xl border-2 border-slate-200/80 bg-white shadow-md shadow-slate-200/50 transition hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-indigo-100 to-violet-100">
        {hasImage ? (
          <img
            src={event.image!}
            alt={event.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-100 via-violet-50 to-amber-50 text-indigo-400">
            <Calendar className="h-12 w-12" aria-hidden />
          </div>
        )}
        {upcoming && (
          <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-emerald-500/30">
            Upcoming
          </span>
        )}
      </div>
      <div className="border-t border-slate-100 bg-gradient-to-b from-white to-slate-50/50 p-5">
        <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 text-lg group-hover:text-indigo-800">{event.title}</h3>
        <p className="mb-4 line-clamp-2 text-sm text-slate-600">{event.description}</p>
        <div className="flex flex-col gap-1.5 text-sm text-slate-500">
          <span className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
            </span>
            {dateStr}
          </span>
          <span className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            </span>
            <span className="truncate">{venue}</span>
          </span>
        </div>
        <span className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition group-hover:bg-indigo-100 group-hover:text-indigo-800">
          View details
          <ArrowRight className="h-4 w-4" aria-hidden />
        </span>
      </div>
    </Link>
  )
}

export default function RealtimeEventsList({ initialEvents }: { initialEvents: Event[] }) {
  const upcoming = initialEvents.filter((e) => isEventUpcoming(e.date))
  const past = initialEvents.filter((e) => !isEventUpcoming(e.date))

  return (
    <div className="space-y-14">
      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-6 inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-2 text-2xl font-bold text-emerald-900">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            Upcoming events
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
      {past.length > 0 && (
        <section>
          <h2 className="mb-6 inline-flex items-center gap-2 rounded-xl bg-slate-200/80 px-4 py-2 text-2xl font-bold text-slate-700">
            <span className="h-2 w-2 rounded-full bg-slate-500" aria-hidden />
            Past events
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
      {initialEvents.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-gradient-to-b from-indigo-50/50 to-white py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-400">
            <Calendar className="h-10 w-10" aria-hidden />
          </div>
          <p className="mt-4 font-medium text-slate-600">No events yet. Check back later.</p>
          <p className="mt-1 text-sm text-slate-500">New events will appear here.</p>
        </div>
      )}
    </div>
  )
}

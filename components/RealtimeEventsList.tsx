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
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-amber-100/50">
        {hasImage ? (
          <img
            src={event.image!}
            alt={event.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-amber-400">
            <Calendar className="h-12 w-12" aria-hidden />
          </div>
        )}
        {upcoming && (
          <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
            Upcoming
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-slate-900">{event.title}</h3>
        <p className="mb-4 line-clamp-2 text-sm text-slate-600">{event.description}</p>
        <div className="flex flex-col gap-1.5 text-sm text-slate-500">
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
            {dateStr}
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
            <span className="truncate">{venue}</span>
          </span>
        </div>
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-600 transition group-hover:text-amber-700">
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
    <div className="space-y-12">
      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-6 text-2xl font-bold text-slate-900">
            <span className="text-emerald-500">Upcoming</span> events
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
          <h2 className="mb-6 text-2xl font-bold text-slate-700">Past events</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
      {initialEvents.length === 0 && (
        <div className="rounded-2xl bg-white py-20 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-500">
            <Calendar className="h-8 w-8" aria-hidden />
          </div>
          <p className="mt-4 text-slate-600">No events yet. Check back later.</p>
        </div>
      )}
    </div>
  )
}

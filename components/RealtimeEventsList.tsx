'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin, ArrowRight, Search } from 'lucide-react'
import type { Event } from '@/types/event'
import { getOptimizedImageUrl } from '@/lib/cloudinary'
import EventLogo from './EventLogo'
import {
  isEventUpcoming,
  getFirstEventDate,
  getLastEventDate,
  parseEventDates,
  formatEventDates,
} from '@/lib/dateUtils'

function matchSearch(event: Event, q: string): boolean {
  if (!q.trim()) return true
  const lower = q.trim().toLowerCase()
  const title = (event.title ?? '').toLowerCase()
  const desc = (event.description ?? '').toLowerCase()
  const fullDesc = (event.fullDescription ?? '').toLowerCase()
  const location = (event.location ?? '').toLowerCase()
  const venue = (event.venue ?? '').toLowerCase()
  const tags = (event.tags ?? []).join(' ').toLowerCase()
  return (
    title.includes(lower) ||
    desc.includes(lower) ||
    fullDesc.includes(lower) ||
    location.includes(lower) ||
    venue.includes(lower) ||
    tags.includes(lower)
  )
}

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
          <>
            <Image
              src={getOptimizedImageUrl(event.image, { w: 600 }) ?? event.image!}
              alt={event.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="absolute left-3 top-3">
              <EventLogo title={event.title} logo={event.logo} size="sm" className="shadow-md" />
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <EventLogo title={event.title} logo={event.logo} size="lg" />
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
  const [search, setSearch] = useState('')

  const { upcoming, past } = useMemo(() => {
    const filtered = initialEvents.filter((e) => matchSearch(e, search))
    const up = filtered.filter((e) => isEventUpcoming(e.date))
    const pa = filtered.filter((e) => !isEventUpcoming(e.date))
    up.sort((a, b) => {
      const dA = getFirstEventDate(a.date)?.getTime() ?? Infinity
      const dB = getFirstEventDate(b.date)?.getTime() ?? Infinity
      return dA - dB
    })
    pa.sort((a, b) => {
      const dA = getLastEventDate(a.date)?.getTime() ?? 0
      const dB = getLastEventDate(b.date)?.getTime() ?? 0
      return dB - dA
    })
    return { upcoming: up, past: pa }
  }, [initialEvents, search])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search events by title, location, venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
        </div>
        {search.trim() && (
          <p className="text-sm text-slate-500">
            Showing {upcoming.length + past.length} of {initialEvents.length} events
          </p>
        )}
      </div>

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
      {(upcoming.length === 0 && past.length === 0) && (
        <div className="rounded-2xl bg-white py-20 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-500">
            <Calendar className="h-8 w-8" aria-hidden />
          </div>
          <p className="mt-4 text-slate-600">
            {search.trim() ? 'No events match your search.' : 'No events yet. Check back later.'}
          </p>
        </div>
      )}
      </div>
    </div>
  )
}

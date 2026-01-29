import Link from 'next/link'
import { Metadata } from 'next'
import { Calendar, Clock, MapPin, ArrowLeft } from 'lucide-react'
import { getPublicEvent } from '@/app/events/actions'
import { notFound } from 'next/navigation'
import RegistrationForm from './RegistrationForm'
import { parseEventDates, formatEventDates, hasEventPassed } from '@/lib/dateUtils'
import PublicHeader from '@/components/PublicHeader'

function getEventImageUrl(imageUrl?: string): string | null {
  if (!imageUrl?.trim()) return null
  const trimmed = imageUrl.trim()
  if (trimmed.startsWith('/') || trimmed.startsWith('http')) return trimmed
  return null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const event = await getPublicEvent(id)
  if (!event) return { title: 'Event Not Found' }
  return {
    title: `${event.title} | IHSB Events`,
    description: event.fullDescription || event.description,
  }
}

export const revalidate = 60

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getPublicEvent(id)
  if (!event) notFound()

  const eventDates = parseEventDates(event.date)
  const hasPassed = hasEventPassed(event.date)
  const venue = event.venue || event.location || 'TBA'
  const imageUrl = getEventImageUrl(event.image)

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-white to-amber-50/30">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to events
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {event.title}
              </h1>
              <p className="mt-2 text-lg text-slate-600">{event.description}</p>
            </div>

            <div className="overflow-hidden rounded-2xl border-2 border-slate-200/80 bg-white shadow-lg shadow-slate-200/50">
              <div className="aspect-video bg-gradient-to-br from-indigo-100 to-violet-100">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={event.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-100 via-violet-50 to-amber-50 text-indigo-400">
                    No image
                  </div>
                )}
              </div>
            </div>

            {(event.fullDescription || event.description) && (
              <section className="rounded-2xl border-2 border-slate-200/80 bg-white p-6 shadow-md shadow-slate-200/30">
                <h2 className="mb-3 text-lg font-semibold text-indigo-900">Overview</h2>
                <p className="whitespace-pre-wrap text-slate-600 leading-relaxed">
                  {event.fullDescription || event.description}
                </p>
              </section>
            )}

            <section className="rounded-2xl border-2 border-indigo-100 bg-white p-6 shadow-md shadow-indigo-100/30">
              <h2 className="mb-4 text-lg font-semibold text-indigo-900">Event details</h2>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-center gap-3 rounded-xl bg-amber-50/80 py-2 px-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-200/80 text-amber-800">
                    <Calendar className="h-4 w-4" aria-hidden />
                  </span>
                  <span>
                    Date{eventDates.length > 1 ? 's' : ''}: {formatEventDates(eventDates, 'long')}
                  </span>
                </li>
                {event.time && (
                  <li className="flex items-center gap-3 rounded-xl bg-indigo-50/80 py-2 px-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-200/80 text-indigo-800">
                      <Clock className="h-4 w-4" aria-hidden />
                    </span>
                    <span>Time: {event.time}</span>
                  </li>
                )}
                <li className="flex items-center gap-3 rounded-xl bg-emerald-50/80 py-2 px-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-200/80 text-emerald-800">
                    <MapPin className="h-4 w-4" aria-hidden />
                  </span>
                  <span>Venue: {venue}</span>
                </li>
              </ul>
            </section>
          </div>

          <div className="lg:col-span-1">
            {hasPassed ? (
              <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100/50 p-6 text-center text-slate-600 shadow-md">
                <p className="font-medium">This event has passed.</p>
                <Link href="/" className="mt-3 inline-block rounded-lg bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-200">
                  View other events
                </Link>
              </div>
            ) : (
              <RegistrationForm eventId={id} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

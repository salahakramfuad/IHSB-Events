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
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
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

            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="aspect-video bg-slate-100">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={event.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                    No image
                  </div>
                )}
              </div>
            </div>

            {(event.fullDescription || event.description) && (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Overview</h2>
                <p className="whitespace-pre-wrap text-slate-600 leading-relaxed">
                  {event.fullDescription || event.description}
                </p>
              </section>
            )}

            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Event details</h2>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Calendar className="h-4 w-4" aria-hidden />
                  </span>
                  <span>
                    Date{eventDates.length > 1 ? 's' : ''}: {formatEventDates(eventDates, 'long')}
                  </span>
                </li>
                {event.time && (
                  <li className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Clock className="h-4 w-4" aria-hidden />
                    </span>
                    <span>Time: {event.time}</span>
                  </li>
                )}
                <li className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <MapPin className="h-4 w-4" aria-hidden />
                  </span>
                  <span>Venue: {venue}</span>
                </li>
              </ul>
            </section>
          </div>

          <div className="lg:col-span-1">
            {hasPassed ? (
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-6 text-center text-slate-500">
                <p className="font-medium">This event has passed.</p>
                <Link href="/" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500">
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

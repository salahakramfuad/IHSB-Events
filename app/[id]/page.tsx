import Link from 'next/link'
import { Metadata } from 'next'
import { Calendar, Clock, MapPin, ArrowLeft, Award, Hash } from 'lucide-react'
import { getPublicEvent, getPublicEventFeaturedRegistrations } from '@/app/events/actions'
import { notFound } from 'next/navigation'
import RegistrationForm from './RegistrationForm'
import EventLogo from '@/components/EventLogo'
import { parseEventDates, formatEventDates, hasEventPassed } from '@/lib/dateUtils'
import PublicHeader from '@/components/PublicHeader'
import EventDetailTheme from '@/components/EventDetailTheme'

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
  const [event, featured] = await Promise.all([
    getPublicEvent(id),
    getPublicEventFeaturedRegistrations(id),
  ])
  if (!event) notFound()

  const eventDates = parseEventDates(event.date)
  const hasPassed = hasEventPassed(event.date)
  const venue = event.venue || event.location || 'TBA'
  const imageUrl = getEventImageUrl(event.image)

  return (
    <div className="min-h-screen bg-slate-100/80">
      <PublicHeader />
      <EventDetailTheme imageUrl={imageUrl}>
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to events
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl bg-white/95 p-6 shadow-sm backdrop-blur sm:p-8">
              <div className="flex items-start gap-4">
                <EventLogo title={event.title} logo={event.logo} size="lg" />
                <div className="min-w-0 flex-1">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                    {event.title}
                  </h1>
                  <p className="mt-2 text-lg text-slate-600">{event.description}</p>
                </div>
              </div>
            </div>

            {(event.fullDescription || event.description) && (
              <section className="rounded-2xl bg-white/95 p-6 shadow-sm backdrop-blur">
                <h2 className="mb-3 text-lg font-semibold text-slate-900">Overview</h2>
                <p className="whitespace-pre-wrap text-slate-600 leading-relaxed">
                  {event.fullDescription || event.description}
                </p>
              </section>
            )}

            {featured.length > 0 && (
              <section className="rounded-2xl bg-white/95 p-6 shadow-sm backdrop-blur">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <Award className="h-5 w-5 text-[hsl(var(--event-accent))]" aria-hidden />
                  Awardees
                </h2>
                <ul className="space-y-2">
                  {featured.map((a) => {
                    const isGold = a.position === 1
                    const isSilver = a.position === 2
                    const isBronze = a.position === 3
                    const rowBg = isGold
                      ? 'bg-amber-50 border-amber-200/80'
                      : isSilver
                        ? 'bg-slate-100 border-slate-300/80'
                        : isBronze
                          ? 'bg-amber-100/90 border-amber-300/80'
                          : 'border-slate-200/60'
                    const badgeBg = isGold
                      ? 'bg-amber-200 text-amber-900'
                      : isSilver
                        ? 'bg-slate-300 text-slate-800'
                        : isBronze
                          ? 'bg-amber-400/90 text-amber-950'
                          : 'bg-slate-100 text-slate-600'
                    return (
                      <li
                        key={`${a.position}-${a.name}`}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${rowBg}`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${badgeBg}`}
                        >
                          {a.position === 1 ? '1st' : a.position === 2 ? '2nd' : a.position === 3 ? '3rd' : `${a.position}th`}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">{a.name}</span>
                            {a.registrationId && (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                <Hash className="h-3 w-3" aria-hidden />
                                {a.registrationId}
                              </span>
                            )}
                          </div>
                          {a.school && (
                            <span className="text-sm text-slate-600">{a.school}</span>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}

            <section className="rounded-2xl bg-white/95 p-6 shadow-sm backdrop-blur">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Event details</h2>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--event-accent)/0.2)] text-[hsl(var(--event-accent))]">
                    <Calendar className="h-5 w-5" aria-hidden />
                  </span>
                  <span>
                    Date{eventDates.length > 1 ? 's' : ''}: {formatEventDates(eventDates, 'long')}
                  </span>
                </li>
                {event.time && (
                  <li className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--event-accent)/0.2)] text-[hsl(var(--event-accent))]">
                      <Clock className="h-5 w-5" aria-hidden />
                    </span>
                    <span>Time: {event.time}</span>
                  </li>
                )}
                <li className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--event-accent)/0.2)] text-[hsl(var(--event-accent))]">
                    <MapPin className="h-5 w-5" aria-hidden />
                  </span>
                  <span>Venue: {venue}</span>
                </li>
              </ul>
            </section>
          </div>

          <div className="lg:col-span-1">
            {hasPassed ? (
              <div className="rounded-2xl bg-white/95 p-6 text-center text-slate-600 shadow-sm backdrop-blur">
                <p className="font-medium">This event has passed.</p>
                <Link
                  href="/"
                  className="mt-3 inline-block rounded-full bg-[hsl(var(--event-accent)/0.2)] px-5 py-2 text-sm font-semibold text-[hsl(var(--event-accent))] transition hover:bg-[hsl(var(--event-accent)/0.3)]"
                >
                  View other events
                </Link>
              </div>
            ) : (
              <RegistrationForm eventId={id} categories={event.categories} />
            )}
          </div>
        </div>
      </EventDetailTheme>
    </div>
  )
}

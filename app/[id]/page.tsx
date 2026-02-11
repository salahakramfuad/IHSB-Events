import Link from 'next/link'
import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Calendar, Clock, MapPin, ArrowLeft, Award, Hash, Phone } from 'lucide-react'
import { getPublicEvent, getPublicEventFeaturedRegistrations } from '@/app/events/actions'
import { notFound } from 'next/navigation'
import EventLogo from '@/components/EventLogo'
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/lib/get-current-user'
import { getStudentProfileByUid } from '@/lib/get-student-profile'

const RegistrationForm = dynamic(() => import('./RegistrationForm'), {
  loading: () => (
    <div className="animate-pulse rounded-2xl bg-white/95 p-6 shadow-sm backdrop-blur">
      <div className="h-8 w-3/4 rounded bg-slate-200" />
      <div className="mt-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 rounded bg-slate-100" />
        ))}
      </div>
    </div>
  ),
})
import { parseEventDates, formatEventDates, hasEventPassed } from '@/lib/dateUtils'
import { hexToLightBg } from '@/lib/colorUtils'
import PublicHeader from '@/components/PublicHeader'
import EventDetailTheme from '@/components/EventDetailTheme'
import type { Event } from '@/types/event'
import type { FeaturedApplicant } from '@/types/registration'

function getEventImageUrl(imageUrl?: string): string | null {
  if (!imageUrl?.trim()) return null
  const trimmed = imageUrl.trim()
  if (trimmed.startsWith('/') || trimmed.startsWith('http')) return trimmed
  return null
}

async function AwardeesSection({ eventId, event }: { eventId: string; event: Event }) {
  const featured = await getPublicEventFeaturedRegistrations(eventId)
  if (featured.length === 0) return null
  const hasCategories = Array.isArray(event.categories) && event.categories.length > 0
  const grouped = hasCategories
    ? featured.reduce<Record<string, FeaturedApplicant[]>>((acc, a) => {
        const cat = a.category?.trim() || 'Uncategorized'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(a)
        return acc
      }, {})
    : null
  const catOrder = event.categories ?? []
  const allCatKeys = grouped ? Object.keys(grouped) : []
  const categories = grouped
    ? [...catOrder.filter((c) => allCatKeys.includes(c)), ...allCatKeys.filter((k) => !catOrder.includes(k))]
    : [null]
  const renderAwardee = (a: FeaturedApplicant) => {
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
        key={`${a.position}-${a.name}-${a.registrationId}`}
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${rowBg}`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${badgeBg}`}
        >
          {a.position === 1 ? '1st' : a.position === 2 ? '2nd' : a.position === 3 ? '3rd' : `${a.position}th`}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900">{a.name || a.registrationId || 'Awardee'}</span>
            {a.registrationId && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Hash className="h-3 w-3" aria-hidden />
                {a.registrationId}
              </span>
            )}
          </div>
          {a.school && <span className="text-sm text-slate-600">{a.school}</span>}
        </div>
      </li>
    )
  }
  return (
    <section className="rounded-2xl border border-[hsl(var(--event-accent)/0.15)] bg-white/95 p-6 shadow-sm backdrop-blur">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <Award className="h-5 w-5 text-[hsl(var(--event-accent))]" aria-hidden />
        Awardees
      </h2>
      <div className="space-y-6">
        {categories.map((cat) => {
          const list = cat ? (grouped?.[cat] ?? []).sort((a, b) => a.position - b.position) : featured
          if (list.length === 0) return null
          return (
            <div key={cat ?? 'all'}>
              {cat && (
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">{cat}</h3>
              )}
              <ul className="space-y-2">{list.map(renderAwardee)}</ul>
            </div>
          )
        })}
      </div>
    </section>
  )
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
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ payment?: string }>
}) {
  const { id } = await params
  const { payment: paymentStatus } = await searchParams
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const currentUser = await getCurrentUser(token)
  const event = await getPublicEvent(id)
  if (!event) notFound()

  let studentPrefill: { name: string; email: string; phone: string; school: string } | undefined
  if (currentUser) {
    const profile = await getStudentProfileByUid(currentUser.uid)
    studentPrefill = {
      name: profile?.displayName ?? '',
      email: currentUser.email ?? '',
      phone: profile?.phone ?? '',
      school: profile?.school ?? '',
    }
  }

  const eventDates = parseEventDates(event.date)
  const hasPassed = hasEventPassed(event.date)
  const venue = event.venue || event.location || 'TBA'
  const imageUrl = getEventImageUrl(event.image)
  const pageBg = event.colorTheme?.trim().startsWith('#')
    ? hexToLightBg(event.colorTheme)
    : undefined

  return (
    <div
      className={`min-h-screen ${!pageBg ? 'bg-slate-100/80' : ''}`}
      style={pageBg ? { backgroundColor: pageBg } : undefined}
    >
      <PublicHeader />
      <EventDetailTheme imageUrl={imageUrl} colorTheme={event.colorTheme}>
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to events
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-[hsl(var(--event-accent)/0.15)] bg-white/95 p-6 shadow-sm backdrop-blur sm:p-8">
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
              <section className="rounded-2xl border border-[hsl(var(--event-accent)/0.15)] bg-white/95 p-6 shadow-sm backdrop-blur">
                <h2 className="mb-3 text-lg font-semibold text-slate-900">Overview</h2>
                <p className="whitespace-pre-wrap text-slate-600 leading-relaxed">
                  {event.fullDescription || event.description}
                </p>
              </section>
            )}

            <Suspense
              fallback={
                <section className="rounded-2xl border border-[hsl(var(--event-accent)/0.15)] bg-white/95 p-6 shadow-sm backdrop-blur">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <Award className="h-5 w-5 text-[hsl(var(--event-accent))]" aria-hidden />
                    Awardees
                  </h2>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
                    ))}
                  </div>
                </section>
              }
            >
              <AwardeesSection eventId={id} event={event} />
            </Suspense>

            <section className="rounded-2xl border border-[hsl(var(--event-accent)/0.15)] bg-white/95 p-6 shadow-sm backdrop-blur">
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
                {Array.isArray(event.contactPersons) &&
                  event.contactPersons.length > 0 &&
                  event.contactPersons
                    .filter((p) => (p.name ?? '').trim() || (p.phone ?? '').trim())
                    .map((cp, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--event-accent)/0.2)] text-[hsl(var(--event-accent))]">
                          <Phone className="h-5 w-5" aria-hidden />
                        </span>
                        <span>
                          {cp.name?.trim() ? (
                            <>
                              <span className="font-medium">{cp.name.trim()}</span>
                              {cp.position?.trim() && (
                                <span className="ml-1.5 text-slate-500">({cp.position.trim()})</span>
                              )}
                              {cp.phone?.trim() && (
                                <a
                                  href={`tel:${cp.phone.trim().replace(/\D/g, '')}`}
                                  className="ml-2 text-slate-600 hover:text-[hsl(var(--event-accent))] hover:underline"
                                >
                                  {cp.phone.trim()}
                                </a>
                              )}
                            </>
                          ) : (
                            cp.phone?.trim() && (
                              <a
                                href={`tel:${cp.phone.trim().replace(/\D/g, '')}`}
                                className="text-slate-600 hover:text-[hsl(var(--event-accent))] hover:underline"
                              >
                                {cp.position?.trim() ? `${cp.position.trim()}: ` : ''}
                                {cp.phone.trim()}
                              </a>
                            )
                          )}
                        </span>
                      </li>
                    ))}
              </ul>
            </section>
          </div>

          <div className="lg:col-span-1">
            <Suspense
              fallback={
                <div className="animate-pulse rounded-2xl bg-white/95 p-6 shadow-sm backdrop-blur">
                  <div className="h-8 w-3/4 rounded bg-slate-200" />
                  <div className="mt-4 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-10 rounded bg-slate-100" />
                    ))}
                  </div>
                </div>
              }
            >
            {hasPassed ? (
              <div className="rounded-2xl border border-[hsl(var(--event-accent)/0.15)] bg-white/95 p-6 text-center text-slate-600 shadow-sm backdrop-blur">
                <p className="font-medium">This event has passed.</p>
                <Link
                  href="/"
                  className="mt-3 inline-block rounded-full bg-[hsl(var(--event-accent)/0.2)] px-5 py-2 text-sm font-semibold text-[hsl(var(--event-accent))] transition hover:bg-[hsl(var(--event-accent)/0.3)]"
                >
                  View other events
                </Link>
              </div>
            ) : paymentStatus === 'success' ? (
              <div className="sticky top-24 rounded-2xl border-2 border-emerald-200/80 bg-white/95 p-8 shadow-sm backdrop-blur text-center">
                <EventLogo title={event.title} logo={event.logo} size="lg" className="mx-auto mb-5" />
                <h3 className="text-2xl font-bold text-slate-900">Registration complete!</h3>
                <p className="mt-3 text-slate-600 leading-relaxed">
                  Your payment was successful. A confirmation email has been sent to your inbox with your registration details.
                </p>
              </div>
            ) : paymentStatus === 'failed' ? (
              <div className="sticky top-24 rounded-2xl border-2 border-red-200/80 bg-white/95 p-8 shadow-sm backdrop-blur text-center">
                <EventLogo title={event.title} logo={event.logo} size="lg" className="mx-auto mb-5" />
                <h3 className="text-2xl font-bold text-slate-900">Payment failed</h3>
                <p className="mt-3 text-slate-600 leading-relaxed">
                  Your payment could not be completed. Please try registering again.
                </p>
                <Link
                  href={`/${id}`}
                  className="mt-5 inline-block rounded-full bg-[hsl(var(--event-accent))] px-5 py-2.5 font-semibold text-white transition hover:opacity-90"
                >
                  Try again
                </Link>
              </div>
            ) : paymentStatus === 'cancelled' ? (
              <div className="sticky top-24 rounded-2xl border-2 border-amber-200/80 bg-white/95 p-8 shadow-sm backdrop-blur text-center">
                <EventLogo title={event.title} logo={event.logo} size="lg" className="mx-auto mb-5" />
                <h3 className="text-2xl font-bold text-slate-900">Payment cancelled</h3>
                <p className="mt-3 text-slate-600 leading-relaxed">
                  You cancelled the payment. You can register again when ready.
                </p>
                <Link
                  href={`/${id}`}
                  className="mt-5 inline-block rounded-full bg-[hsl(var(--event-accent))] px-5 py-2.5 font-semibold text-white transition hover:opacity-90"
                >
                  Register again
                </Link>
              </div>
            ) : (
              currentUser ? (
                <RegistrationForm
                  eventId={id}
                  categories={event.categories}
                  isPaid={event.isPaid}
                  amount={event.amount}
                  categoryAmounts={event.categoryAmounts}
                  initialName={studentPrefill?.name}
                  initialEmail={studentPrefill?.email}
                  initialPhone={studentPrefill?.phone}
                  initialSchool={studentPrefill?.school}
                />
              ) : (
                <div className="sticky top-24 rounded-2xl border border-[hsl(var(--event-accent)/0.2)] bg-white/95 p-6 text-center text-slate-700 shadow-sm backdrop-blur">
                  <h3 className="text-lg font-semibold text-slate-900">Sign in to register</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Please sign in with your email to register for this event and view your registrations in the student dashboard.
                  </p>
                  <Link
                    href={`/login?redirect=/${id}`}
                    className="mt-4 inline-flex items-center justify-center rounded-full bg-[hsl(var(--event-accent))] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Go to login
                  </Link>
                </div>
              )
            )}
            </Suspense>
          </div>
        </div>
      </EventDetailTheme>
    </div>
  )
}

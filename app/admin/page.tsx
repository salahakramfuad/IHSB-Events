import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { Calendar, Users, ArrowRight, MapPin, Clock, Banknote } from 'lucide-react'
import { adminDb } from '@/lib/firebase-admin'
import { getCurrentAdminProfile } from '@/lib/get-admin'
import { isEventUpcoming, getFirstEventDate, parseEventDates, formatEventDates } from '@/lib/dateUtils'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function parseDate(data: unknown): string | string[] | undefined {
  let date = data
  if (date && typeof date === 'object' && 'toDate' in date) {
    return (date as { toDate: () => Date }).toDate().toISOString().split('T')[0]
  }
  if (date && typeof date === 'object' && '_seconds' in date) {
    return new Date((date as { _seconds: number })._seconds * 1000).toISOString().split('T')[0]
  }
  return typeof date === 'string' ? date : Array.isArray(date) ? date : undefined
}

export default async function AdminDashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const greeting = getGreeting()

  let upcomingCount = 0
  let totalEvents = 0
  let totalRegistrations = 0
  let totalPaymentsCollected = 0
  let nextUpcomingEvent: {
    id: string
    title: string
    date: string | string[]
    time?: string
    location: string
    venue?: string
    image?: string
    logo?: string
    registrationCount: number
  } | null = null

  // Fetch profile and events in parallel for faster initial load
  const [profile, eventsSnap] = await Promise.all([
    getCurrentAdminProfile(token),
    adminDb ? adminDb.collection('events').get() : Promise.resolve(null),
  ])
  const displayName = profile?.displayName?.trim() || profile?.email?.split('@')[0] || ''

  if (eventsSnap) {
    try {
      totalEvents = eventsSnap.size
      const eventsWithDate: { id: string; date: string | string[]; data: Record<string, unknown> }[] = []
      eventsSnap.docs.forEach((d) => {
        const data = d.data()
        const date = parseDate(data.date)
        eventsWithDate.push({ id: d.id, date: date as string | string[], data: { ...data, date } })
      })
      const upcoming = eventsWithDate.filter((e) => isEventUpcoming(e.date))
      upcomingCount = upcoming.length

      // Parallelize all registration count fetches and payment totals
      const regCounts = await Promise.all(
        eventsSnap.docs.map(async (doc) => {
          const data = doc.data()
          const isPaid = !!data.isPaid && typeof data.amount === 'number' && data.amount > 0
          const amount = (data.amount as number) ?? 0
          const snap = await doc.ref.collection('registrations').get()
          let paidCount = 0
          if (isPaid) {
            snap.forEach((d) => {
              if (d.data().paymentStatus === 'completed') paidCount++
            })
          }
          return { id: doc.id, count: snap.size, paidCount, amount, isPaid }
        })
      )
      const regCountMap = Object.fromEntries(regCounts.map((r) => [r.id, r.count]))
      totalRegistrations = regCounts.reduce((sum, r) => sum + r.count, 0)
      totalPaymentsCollected = regCounts.reduce((sum, r) => sum + (r.isPaid ? r.amount * r.paidCount : 0), 0)

      if (upcoming.length > 0) {
        const sorted = [...upcoming].sort((a, b) => {
          const dA = getFirstEventDate(a.date)
          const dB = getFirstEventDate(b.date)
          if (!dA) return 1
          if (!dB) return -1
          return dA.getTime() - dB.getTime()
        })
        const next = sorted[0]
        nextUpcomingEvent = {
          id: next.id,
          title: String(next.data.title ?? 'Untitled'),
          date: next.date,
          time: next.data.time as string | undefined,
          location: String(next.data.location ?? ''),
          venue: next.data.venue as string | undefined,
          image: next.data.image as string | undefined,
          logo: next.data.logo as string | undefined,
          registrationCount: regCountMap[next.id] ?? 0,
        }
      }
    } catch (e) {
      console.error('Admin dashboard stats error:', e)
    }
  }

  const stats = [
    { label: 'Upcoming events', value: upcomingCount, icon: Calendar, color: 'bg-indigo-100 text-indigo-600' },
    { label: 'Total events', value: totalEvents, icon: Calendar, color: 'bg-slate-100 text-slate-600' },
    { label: 'Total registrations', value: totalRegistrations, icon: Users, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Total payments collected', value: `৳${totalPaymentsCollected.toLocaleString()}`, icon: Banknote, color: 'bg-amber-100 text-amber-600' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        {displayName ? `${greeting}, ${displayName}!` : `${greeting}!`}
      </h1>
      <p className="text-slate-600 mb-8">Here’s what’s happening with your events.</p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
          >
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {nextUpcomingEvent && (
        <div className="mb-10 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-indigo-50/60 px-5 py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Next upcoming event
            </p>
          </div>
          <Link
            href={`/admin/events/${nextUpcomingEvent.id}`}
            className="block p-5 transition hover:bg-slate-50/50"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {(nextUpcomingEvent.image || nextUpcomingEvent.logo) && (
                <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-20 sm:w-32">
                  <Image
                    src={nextUpcomingEvent.image || nextUpcomingEvent.logo!}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-slate-900">{nextUpcomingEvent.title}</h3>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                    {formatEventDates(parseEventDates(nextUpcomingEvent.date), 'long')}
                  </span>
                  {nextUpcomingEvent.time && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-4 w-4 shrink-0" aria-hidden />
                      {nextUpcomingEvent.time}
                    </span>
                  )}
                  {(nextUpcomingEvent.venue || nextUpcomingEvent.location) && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                      {nextUpcomingEvent.venue || nextUpcomingEvent.location}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  <Users className="inline h-4 w-4 align-text-bottom" aria-hidden />{' '}
                  {nextUpcomingEvent.registrationCount} registration
                  {nextUpcomingEvent.registrationCount !== 1 ? 's' : ''}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-indigo-600 font-medium">
                View details
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </div>
          </Link>
        </div>
      )}

      <Link
        href="/admin/events"
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-500"
      >
        Manage events
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  )
}

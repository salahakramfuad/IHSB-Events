import Link from 'next/link'
import { cookies } from 'next/headers'
import { Calendar, Users, ArrowRight } from 'lucide-react'
import { adminDb } from '@/lib/firebase-admin'
import { getCurrentAdminProfile } from '@/lib/get-admin'
import { isEventUpcoming } from '@/lib/dateUtils'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function AdminDashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const profile = await getCurrentAdminProfile(token)
  const greeting = getGreeting()
  const displayName = profile?.displayName?.trim() || profile?.email?.split('@')[0] || ''

  let upcomingCount = 0
  let totalEvents = 0
  let totalRegistrations = 0

  if (adminDb) {
    try {
      const eventsSnap = await adminDb.collection('events').get()
      totalEvents = eventsSnap.size
      const events = eventsSnap.docs.map((d) => {
        const data = d.data()
        let date = data.date
        if (date && typeof date === 'object' && 'toDate' in date) {
          date = (date as { toDate: () => Date }).toDate().toISOString().split('T')[0]
        } else if (date && typeof date === 'object' && '_seconds' in date) {
          date = new Date((date as { _seconds: number })._seconds * 1000).toISOString().split('T')[0]
        }
        return { date }
      })
      upcomingCount = events.filter((e) => isEventUpcoming(e.date)).length

      for (const doc of eventsSnap.docs) {
        const regsSnap = await doc.ref.collection('registrations').get()
        totalRegistrations += regsSnap.size
      }
    } catch (e) {
      console.error('Admin dashboard stats error:', e)
    }
  }

  const stats = [
    { label: 'Upcoming events', value: upcomingCount, icon: Calendar, color: 'bg-indigo-100 text-indigo-600' },
    { label: 'Total events', value: totalEvents, icon: Calendar, color: 'bg-slate-100 text-slate-600' },
    { label: 'Total registrations', value: totalRegistrations, icon: Users, color: 'bg-emerald-100 text-emerald-600' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        {displayName ? `${greeting}, ${displayName}!` : `${greeting}!`}
      </h1>
      <p className="text-slate-600 mb-8">Here’s what’s happening with your events.</p>
      <div className="grid gap-5 sm:grid-cols-3 mb-10">
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

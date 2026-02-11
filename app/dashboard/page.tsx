import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/lib/get-current-user'
import { getPublicEvents } from '@/app/events/actions'
import { hasEventPassed, formatEventDates, parseEventDates } from '@/lib/dateUtils'
import type { Event } from '@/types/event'
import DashboardClient from './DashboardClient'

export const revalidate = 0

type UpcomingEventItem = {
  id: string
  title: string
  dateLabel: string
}

function getUpcomingEventsWithLabels(events: Event[]): UpcomingEventItem[] {
  const items: UpcomingEventItem[] = []
  for (const event of events) {
    if (hasEventPassed(event.date)) continue
    const dates = parseEventDates(event.date)
    const dateLabel = dates.length > 0 ? formatEventDates(dates, 'short') : 'Date TBA'
    items.push({ id: event.id, title: event.title, dateLabel })
  }
  return items
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const user = await getCurrentUser(token)

  if (!user) {
    redirect('/login?redirect=/dashboard')
  }

  const events = await getPublicEvents()
  const upcomingEvents = getUpcomingEventsWithLabels(events)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Student dashboard
        </h1>
        <p className="mt-2 text-slate-600">
          View upcoming events, register, and see your past results and positions.
        </p>
      </header>
      <DashboardClient upcomingEvents={upcomingEvents} />
    </div>
  )
}


import { getAdminEvents, getSchoolsWithStats } from '@/app/admin/actions'
import SchoolsPageClient from './SchoolsPageClient'

export default async function AdminSchoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>
}) {
  const { eventId } = await searchParams
  const [events, schools] = await Promise.all([
    getAdminEvents(),
    getSchoolsWithStats(eventId || undefined),
  ])
  const eventOptions = events.map((e) => ({ id: e.id, title: e.title }))
  return (
    <SchoolsPageClient
      events={eventOptions}
      schools={schools}
      selectedEventId={eventId || ''}
    />
  )
}

import { getEventOptionsForFilter, getSchoolsWithStats } from '@/app/admin/actions'
import SchoolsPageClient from './SchoolsPageClient'

export default async function AdminSchoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>
}) {
  const { eventId } = await searchParams
  const [eventOptions, schools] = await Promise.all([
    getEventOptionsForFilter(),
    getSchoolsWithStats(eventId || undefined),
  ])
  return (
    <SchoolsPageClient
      events={eventOptions}
      schools={schools}
      selectedEventId={eventId || ''}
    />
  )
}

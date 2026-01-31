import Link from 'next/link'
import { getAdminEvents, getCurrentAdminProfileInServer } from '@/app/admin/actions'
import { Plus } from 'lucide-react'
import EventsTableWithSearch from './EventsTableWithSearch'

export default async function AdminEventsPage() {
  const [events, profile] = await Promise.all([
    getAdminEvents(),
    getCurrentAdminProfileInServer(),
  ])

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Events</h1>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Create event
        </Link>
      </div>
      <EventsTableWithSearch events={events} profile={profile} />
    </div>
  )
}

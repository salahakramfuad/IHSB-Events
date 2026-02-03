import Link from 'next/link'
import dynamic from 'next/dynamic'
import { getAdminEvent, getEventRegistrations, getCurrentAdminProfileInServer } from '@/app/admin/actions'
import ExportRegistrationsButton from './ExportRegistrationsButton'
import EventStatsSection from './EventStatsSection'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

const RegistrationsTableWithSearch = dynamic(
  () => import('./RegistrationsTableWithSearch'),
  { loading: () => <div className="h-64 animate-pulse rounded-2xl bg-slate-100" /> }
)

export default async function EventRegistrationsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [event, registrations, profile] = await Promise.all([
    getAdminEvent(id),
    getEventRegistrations(id),
    getCurrentAdminProfileInServer(),
  ])
  if (!event) notFound()

  const canEdit =
    profile?.role === 'superAdmin' || event.createdBy === profile?.uid

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Events
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Registrations: {event.title}
          </h1>
        </div>
        <ExportRegistrationsButton eventId={id} eventTitle={event.title} registrations={registrations} />
      </div>
      <EventStatsSection registrations={registrations} />
      <RegistrationsTableWithSearch
        eventId={id}
        event={event}
        registrations={registrations}
        canEdit={canEdit}
        isSuperAdmin={profile?.role === 'superAdmin'}
        eventCategories={event.categories}
      />
    </div>
  )
}

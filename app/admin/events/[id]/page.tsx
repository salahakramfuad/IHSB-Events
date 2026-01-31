import { getAdminEvent, getEventRegistrations, getCurrentAdminProfileInServer } from '@/app/admin/actions'
import { notFound } from 'next/navigation'
import EventDetailWithEdit from './EventDetailWithEdit'

export default async function AdminEventDetailPage({
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
  const isSuperAdmin = profile?.role === 'superAdmin'

  return (
    <EventDetailWithEdit
      event={event}
      registrations={registrations}
      canEdit={canEdit}
      isSuperAdmin={isSuperAdmin}
    />
  )
}

import dynamic from 'next/dynamic'
import { unstable_cache } from 'next/cache'
import { getAdminEvent, getEventRegistrations, getCurrentAdminProfileInServer } from '@/app/admin/actions'
import { notFound } from 'next/navigation'

const EventDetailWithEdit = dynamic(() => import('./EventDetailWithEdit'), {
  loading: () => (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-64 rounded bg-slate-200" />
      <div className="h-48 rounded-2xl bg-slate-100" />
      <div className="h-96 rounded-2xl bg-slate-100" />
    </div>
  ),
})

export const revalidate = 60

async function getCachedAdminEvent(id: string) {
  return unstable_cache(
    () => getAdminEvent(id),
    ['admin-event', id],
    { revalidate: 60, tags: [`event-${id}`] }
  )()
}

async function getCachedEventRegistrations(id: string) {
  return unstable_cache(
    () => getEventRegistrations(id),
    ['admin-event-registrations', id],
    { revalidate: 30, tags: [`event-${id}`] }
  )()
}

export default async function AdminEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [event, registrations, profile] = await Promise.all([
    getCachedAdminEvent(id),
    getCachedEventRegistrations(id),
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

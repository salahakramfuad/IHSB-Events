import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminEvent, getCurrentAdminProfileInServer } from '@/app/admin/actions'
import EventForm from '../../EventForm'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [event, profile] = await Promise.all([
    getAdminEvent(id),
    getCurrentAdminProfileInServer(),
  ])
  if (!event) notFound()

  const canEdit =
    profile?.role === 'superAdmin' || event.createdBy === profile?.uid
  if (!canEdit) {
    redirect(`/admin/events/${id}`)
  }

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Events
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Edit event</h1>
      </div>
      <EventForm event={event} />
    </div>
  )
}

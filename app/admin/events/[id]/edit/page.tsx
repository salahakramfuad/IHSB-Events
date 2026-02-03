import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminEvent, getCurrentAdminProfileInServer } from '@/app/admin/actions'
import EventForm from '../../EventForm'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'

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
    <div className="max-w-2xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Events
          </Link>
          <span className="text-slate-300">/</span>
          <Link
            href={`/admin/events/${id}`}
            className="text-sm text-slate-500 transition hover:text-slate-900"
          >
            {event.title}
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-medium text-slate-900">Edit</span>
        </div>
        <Link
          href={`/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
        >
          View event
          <ExternalLink className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      <h1 className="mb-6 text-xl font-bold text-slate-900">Edit event</h1>
      <EventForm event={event} />
    </div>
  )
}

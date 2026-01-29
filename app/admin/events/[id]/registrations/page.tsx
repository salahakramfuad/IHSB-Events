import Link from 'next/link'
import { getAdminEvent, getEventRegistrations } from '@/app/admin/actions'
import ExportRegistrationsButton from './ExportRegistrationsButton'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowLeft, Download } from 'lucide-react'

export default async function EventRegistrationsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [event, registrations] = await Promise.all([
    getAdminEvent(id),
    getEventRegistrations(id),
  ])
  if (!event) notFound()

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
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Name
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Email
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Phone
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                School
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Note
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Registered
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {registrations.map((reg) => (
              <tr key={reg.id} className="transition hover:bg-slate-50/50">
                <td className="px-5 py-4 text-sm font-medium text-slate-900">{reg.name}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{reg.email}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{reg.phone}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{reg.school}</td>
                <td className="max-w-xs truncate px-5 py-4 text-sm text-slate-600">{reg.note ?? '—'}</td>
                <td className="px-5 py-4 text-sm text-slate-500">
                  {typeof reg.createdAt === 'string'
                    ? format(new Date(reg.createdAt), 'PPp')
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {registrations.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-slate-500">No registrations yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Trash2, RotateCcw, Calendar, Users, ArrowLeft, AlertTriangle } from 'lucide-react'
import type { TrashedEvent, TrashedRegistration } from '@/app/admin/actions'
import { restoreEvent, restoreRegistration } from '@/app/admin/actions'

interface TrashPageClientProps {
  trashedEvents: TrashedEvent[]
  trashedRegistrations: TrashedRegistration[]
}

function daysUntilPurge(deletedAt: string): number {
  const deleted = new Date(deletedAt)
  const purgeDate = new Date(deleted)
  purgeDate.setDate(purgeDate.getDate() + 30)
  const now = new Date()
  const diff = purgeDate.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function TrashPageClient({
  trashedEvents,
  trashedRegistrations,
}: TrashPageClientProps) {
  const router = useRouter()
  const [restoringEvent, setRestoringEvent] = useState<string | null>(null)
  const [restoringReg, setRestoringReg] = useState<string | null>(null)

  const handleRestoreEvent = async (id: string) => {
    setRestoringEvent(id)
    try {
      const result = await restoreEvent(id)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error ?? 'Failed to restore')
      }
    } finally {
      setRestoringEvent(null)
    }
  }

  const handleRestoreRegistration = async (eventId: string, regId: string) => {
    const key = `${eventId}:${regId}`
    setRestoringReg(key)
    try {
      const result = await restoreRegistration(eventId, regId)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error ?? 'Failed to restore')
      }
    } finally {
      setRestoringReg(null)
    }
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Events
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Trash</h1>
          <p className="mt-1 text-sm text-slate-500">
            Deleted items are kept for 30 days, then permanently removed. Super admins can restore.
          </p>
        </div>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
        <p className="text-sm text-amber-800">
          Items in trash will be automatically permanently deleted after 30 days. Restore before then if needed.
        </p>
      </div>

      {/* Trashed events */}
      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Calendar className="h-5 w-5" aria-hidden />
          Deleted events ({trashedEvents.length})
        </h2>
        {trashedEvents.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 py-12 text-center">
            <Trash2 className="mx-auto h-12 w-12 text-slate-300" aria-hidden />
            <p className="mt-4 text-slate-500">No deleted events</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Event
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Deleted
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Purges in
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {trashedEvents.map((event) => {
                  const daysLeft = daysUntilPurge(event.deletedAt)
                  return (
                    <tr key={event.id} className="transition hover:bg-slate-50/50">
                      <td className="px-5 py-4">
                        <span className="font-medium text-slate-900">{event.title}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {format(new Date(event.deletedAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        <span className={daysLeft <= 7 ? 'font-medium text-amber-600' : ''}>
                          {daysLeft} days
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRestoreEvent(event.id)}
                          disabled={!!restoringEvent}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          <RotateCcw className="h-4 w-4" aria-hidden />
                          {restoringEvent === event.id ? 'Restoring…' : 'Restore'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Trashed registrations */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Users className="h-5 w-5" aria-hidden />
          Deleted registrations ({trashedRegistrations.length})
        </h2>
        {trashedRegistrations.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 py-12 text-center">
            <Trash2 className="mx-auto h-12 w-12 text-slate-300" aria-hidden />
            <p className="mt-4 text-slate-500">No deleted registrations</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Name
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Event
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Deleted
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Purges in
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {trashedRegistrations.map((reg) => {
                    const key = `${reg.eventId}:${reg.id}`
                    const daysLeft = daysUntilPurge(reg.deletedAt)
                    return (
                      <tr key={key} className="transition hover:bg-slate-50/50">
                        <td className="px-5 py-4">
                          <span className="font-medium text-slate-900">{reg.name}</span>
                          <span className="ml-1 text-sm text-slate-500">({reg.email})</span>
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={`/admin/events/${reg.eventId}/registrations`}
                            className="text-sm font-medium text-indigo-600 hover:underline"
                          >
                            {reg.eventTitle}
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {format(new Date(reg.deletedAt), 'MMM d, yyyy')}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          <span className={daysLeft <= 7 ? 'font-medium text-amber-600' : ''}>
                            {daysLeft} days
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRestoreRegistration(reg.eventId, reg.id)}
                            disabled={!!restoringReg}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                          >
                            <RotateCcw className="h-4 w-4" aria-hidden />
                            {restoringReg === key ? 'Restoring…' : 'Restore'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

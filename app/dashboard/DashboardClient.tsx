'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  Hash,
  Award,
  Loader2,
  ChevronRight,
  Ticket,
  Sparkles,
} from 'lucide-react'

type UpcomingEventItem = {
  id: string
  title: string
  dateLabel: string
}

type DashboardClientProps = {
  upcomingEvents: UpcomingEventItem[]
}

type MyRegistration = {
  eventId: string
  eventTitle: string
  eventDate: string | null
  registrationId: string
  category?: string | null
  position: number | null
  createdAt: string
}

function positionLabel(position: number): string {
  if (position === 1) return '1st'
  if (position === 2) return '2nd'
  if (position === 3) return '3rd'
  return `${position}th`
}

export default function DashboardClient({
  upcomingEvents,
}: DashboardClientProps) {
  const router = useRouter()
  const [registrations, setRegistrations] = useState<MyRegistration[]>([])
  const [loadingRegs, setLoadingRegs] = useState(true)
  const [regsError, setRegsError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/me/registrations', { credentials: 'include' })
        if (!res.ok) {
          if (res.status === 401) {
            if (isMounted) {
              router.replace('/login?redirect=/dashboard')
            }
            return
          }
          const data = await res.json().catch(() => ({}))
          if (isMounted) {
            setRegsError(data.error || 'Failed to load your registrations.')
          }
        } else {
          const data = await res.json().catch(() => ({}))
          if (isMounted && Array.isArray(data.registrations)) {
            setRegistrations(data.registrations)
          }
        }
      } catch {
        if (isMounted) {
          setRegsError('Network error while loading registrations.')
        }
      } finally {
        if (isMounted) {
          setLoadingRegs(false)
        }
      }
    })()
    return () => {
      isMounted = false
    }
  }, [router])

  return (
    <div className="space-y-8">
      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-slate-200/60 backdrop-blur sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Calendar className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Upcoming events</p>
              <p className="text-2xl font-bold text-slate-900">{upcomingEvents.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-slate-200/60 backdrop-blur sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Ticket className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">My registrations</p>
              <p className="text-2xl font-bold text-slate-900">
                {loadingRegs ? '—' : registrations.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Upcoming events */}
        <section className="lg:col-span-2">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Calendar className="h-5 w-5 text-indigo-500" aria-hidden />
                Upcoming events
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Register for events and join the action.
              </p>
            </div>
            <div className="p-4 sm:p-5">
              {upcomingEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Sparkles className="h-7 w-7" aria-hidden />
                  </div>
                  <p className="mt-4 text-sm font-medium text-slate-600">
                    No upcoming events right now
                  </p>
                  <p className="mt-1 max-w-xs text-xs text-slate-500">
                    Check back later for new events to register.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {upcomingEvents.map((event) => (
                    <li key={event.id}>
                      <Link
                        href={`/${event.id}`}
                        className="group flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-slate-50/30 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700">
                            {event.title}
                          </h3>
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                            <Calendar className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                            {event.dateLabel}
                          </p>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition group-hover:bg-indigo-500">
                          Register
                          <ChevronRight className="h-4 w-4" aria-hidden />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* My registrations */}
        <section className="lg:col-span-1">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 overflow-hidden sticky top-24">
            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Ticket className="h-5 w-5 text-emerald-500" aria-hidden />
                My registrations
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Past events and your results.
              </p>
            </div>
            <div className="max-h-[calc(100vh-18rem)] overflow-y-auto p-4 sm:p-5">
              {loadingRegs ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
                  <span className="mt-3 text-sm">Loading…</span>
                </div>
              ) : regsError ? (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {regsError}
                </div>
              ) : registrations.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Ticket className="h-6 w-6" aria-hidden />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-600">
                    No registrations yet
                  </p>
                  <p className="mt-1 max-w-[200px] text-xs text-slate-500">
                    Register for an upcoming event to see it here.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {registrations.map((reg) => (
                    <li
                      key={`${reg.eventId}-${reg.registrationId}`}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 font-semibold text-slate-900 leading-snug">
                          {reg.eventTitle}
                        </p>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-slate-200/80 px-2 py-0.5 font-mono text-[10px] font-medium text-slate-600">
                          <Hash className="h-3 w-3" aria-hidden />
                          {reg.registrationId}
                        </span>
                      </div>
                      {reg.eventDate && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          {reg.eventDate}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {reg.category && (
                          <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                            {reg.category}
                          </span>
                        )}
                        {reg.position != null && reg.position >= 1 && reg.position <= 20 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                            <Award className="h-3.5 w-3.5" aria-hidden />
                            {positionLabel(reg.position)} place
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

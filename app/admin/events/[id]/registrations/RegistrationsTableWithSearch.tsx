'use client'

import { useMemo, useState, useTransition } from 'react'
import { format } from 'date-fns'
import { Search, Users } from 'lucide-react'
import type { Registration } from '@/types/registration'
import { updateRegistrationPosition } from '@/app/admin/actions'

const POSITION_OPTIONS = Array.from({ length: 20 }, (_, i) => i + 1)

function matchSearch(reg: Registration, q: string): boolean {
  if (!q.trim()) return true
  const lower = q.trim().toLowerCase()
  const name = (reg.name ?? '').toLowerCase()
  const email = (reg.email ?? '').toLowerCase()
  const phone = (reg.phone ?? '').toLowerCase()
  const school = (reg.school ?? '').toLowerCase()
  const note = (reg.note ?? '').toLowerCase()
  const regId = (reg.registrationId ?? reg.id ?? '').toLowerCase()
  return (
    name.includes(lower) ||
    email.includes(lower) ||
    phone.includes(lower) ||
    school.includes(lower) ||
    note.includes(lower) ||
    regId.includes(lower)
  )
}

interface RegistrationsTableWithSearchProps {
  eventId: string
  registrations: Registration[]
  canEdit: boolean
}

export default function RegistrationsTableWithSearch({
  eventId,
  registrations,
  canEdit,
}: RegistrationsTableWithSearchProps) {
  const [search, setSearch] = useState('')
  const [pending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    return registrations.filter((reg) => matchSearch(reg, search))
  }, [registrations, search])

  const handlePositionChange = (registrationDocId: string, value: string) => {
    const position = value === '' ? null : parseInt(value, 10)
    if (position !== null && (position < 1 || position > 20)) return
    startTransition(async () => {
      await updateRegistrationPosition(eventId, registrationDocId, position)
    })
  }

  return (
    <>
      <div className="mb-4">
        <label htmlFor="reg-search" className="sr-only">
          Search applicants
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            id="reg-search"
            type="search"
            placeholder="Search by name, email, phone, school, note, or registration ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        {search.trim() && (
          <p className="mt-1.5 text-xs text-slate-500">
            Showing {filtered.length} of {registrations.length} applicants
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-700">Registration list</h3>
        </div>
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Position
              </th>
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
            {filtered.map((reg) => (
              <tr key={reg.id} className="transition hover:bg-slate-50/50">
                <td className="px-5 py-4">
                  {canEdit ? (
                    <select
                      value={reg.position ?? ''}
                      onChange={(e) => handlePositionChange(reg.id, e.target.value)}
                      disabled={!!pending}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                      aria-label={`Set position for ${reg.name}`}
                    >
                      <option value="">—</option>
                      {POSITION_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-sm text-slate-600">
                      {reg.position != null
                        ? reg.position === 1
                          ? '1st'
                          : reg.position === 2
                            ? '2nd'
                            : reg.position === 3
                              ? '3rd'
                              : `${reg.position}th`
                        : '—'}
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-sm font-medium text-slate-900">{reg.name}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{reg.email}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{reg.phone}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{reg.school}</td>
                <td className="max-w-xs truncate px-5 py-4 text-sm text-slate-600">
                  {reg.note ?? '—'}
                </td>
                <td className="px-5 py-4 text-sm text-slate-500">
                  {typeof reg.createdAt === 'string'
                    ? format(new Date(reg.createdAt), 'PPp')
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-300" aria-hidden />
            <p className="mt-4 text-slate-500">
              {registrations.length === 0 ? 'No registrations yet.' : 'No applicants match your search.'}
            </p>
          </div>
        )}
      </div>
    </>
  )
}

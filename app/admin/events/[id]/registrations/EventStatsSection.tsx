'use client'

import type { ReactNode } from 'react'
import { Users, Award, Building2, Banknote } from 'lucide-react'
import type { Registration } from '@/types/registration'
import type { Event } from '@/types/event'

interface EventStatsSectionProps {
  event: Event
  registrations: Registration[]
}

function computeSchoolStats(registrations: Registration[]) {
  const bySchool: Record<string, { participants: number; winners: number }> = {}
  for (const reg of registrations) {
    const school = reg.school?.trim() || 'Unknown'
    if (!bySchool[school]) {
      bySchool[school] = { participants: 0, winners: 0 }
    }
    bySchool[school].participants += 1
    if (reg.position != null && reg.position >= 1 && reg.position <= 20) {
      bySchool[school].winners += 1
    }
  }
  return Object.entries(bySchool)
    .map(([school, stats]) => ({ school, ...stats }))
    .sort((a, b) => b.participants - a.participants)
}

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

function getAmountForReg(event: Event, reg: Registration): number {
  const isPaid = !!event.isPaid
  if (!isPaid || reg.paymentStatus !== 'completed') return 0
  const cats = event.categories
  const catAmounts = event.categoryAmounts
  if (Array.isArray(cats) && cats.length > 0 && catAmounts && reg.category) {
    return typeof catAmounts[reg.category] === 'number' ? catAmounts[reg.category]! : (event.amount ?? 0)
  }
  return typeof event.amount === 'number' ? event.amount : 0
}

export default function EventStatsSection({ event, registrations }: EventStatsSectionProps) {
  const totalParticipants = registrations.length
  const totalWinners = registrations.filter(
    (r) => r.position != null && r.position >= 1 && r.position <= 20
  ).length
  const schoolStats = computeSchoolStats(registrations)

  const participantsOnly = totalParticipants - totalWinners
  const pieData = [
    { name: 'Participants', value: participantsOnly, color: PIE_COLORS[0] },
    { name: 'Winners', value: totalWinners, color: PIE_COLORS[1] },
  ].filter((d) => d.value > 0)

  const totalForPie = pieData.reduce((s, d) => s + d.value, 0)
  const circumference = 2 * Math.PI * 40

  const totalAmountCollected = event.isPaid
    ? registrations.reduce((sum, r) => sum + getAmountForReg(event, r), 0)
    : 0

  return (
    <div className="mb-10 space-y-8">
      <div className={`grid gap-5 sm:grid-cols-2 ${event.isPaid ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <Users className="h-5 w-5" aria-hidden />
          </div>
          <p className="text-sm font-medium text-slate-500">Total participants</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{totalParticipants}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <Award className="h-5 w-5" aria-hidden />
          </div>
          <p className="text-sm font-medium text-slate-500">Winners (1st–20th)</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{totalWinners}</p>
        </div>
        {event.isPaid && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Banknote className="h-5 w-5" aria-hidden />
            </div>
            <p className="text-sm font-medium text-slate-500">Amount collected</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">৳{totalAmountCollected.toLocaleString()}</p>
          </div>
        )}
      </div>

      {pieData.length > 0 && totalForPie > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Participants vs winners
          </h3>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <div className="relative h-48 w-48">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                {pieData.reduce<{ offset: number; elements: ReactNode[] }>(
                  (acc, d, i) => {
                    const segmentLength = (d.value / totalForPie) * circumference
                    const dashArray = `${segmentLength} ${circumference}`
                    const dashOffset = -acc.offset
                    acc.offset += segmentLength
                    acc.elements.push(
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={d.color}
                        strokeWidth="20"
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                      />
                    )
                    return acc
                  },
                  { offset: 0, elements: [] }
                ).elements}
              </svg>
            </div>
            <div className="flex flex-col gap-2">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 shrink-0 rounded"
                    style={{ backgroundColor: d.color }}
                    aria-hidden
                  />
                  <span className="text-sm text-slate-700">
                    {d.name}: {d.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {schoolStats.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
              <Building2 className="h-4 w-4" aria-hidden />
              School breakdown
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    School
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Participants
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Winners
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {schoolStats.map((row) => (
                  <tr key={row.school} className="transition hover:bg-slate-50/50">
                    <td className="px-5 py-4 font-medium text-slate-900">{row.school}</td>
                    <td className="px-5 py-4 text-right text-slate-600">{row.participants}</td>
                    <td className="px-5 py-4 text-right text-slate-600">{row.winners}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

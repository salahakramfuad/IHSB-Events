'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Trophy,
  Award,
  Send,
  CheckCircle,
  Hash,
} from 'lucide-react'
import type { Event } from '@/types/event'
import type { Registration } from '@/types/registration'
import { notifySingleAwardee } from '@/app/admin/actions'

function positionLabel(n: number) {
  return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`
}

function getPositionColor(position: number) {
  if (position === 1) return 'bg-gradient-to-br from-yellow-50 to-amber-100 border-amber-200'
  if (position === 2) return 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300'
  if (position === 3) return 'bg-gradient-to-br from-orange-50 to-amber-50 border-amber-200'
  return 'bg-white border-slate-200'
}

interface WinnersSectionProps {
  event: Event
  winners: Registration[]
  winnersByCategory: Record<string, Registration[]> | null
  categoryOrder: string[]
  hasCategories: boolean
  canEdit: boolean
}

export default function WinnersSection({
  event,
  winners,
  winnersByCategory,
  categoryOrder,
  hasCategories,
  canEdit,
}: WinnersSectionProps) {
  const router = useRouter()
  const [notifyModal, setNotifyModal] = useState<Registration | null>(null)
  const [notifyLoading, setNotifyLoading] = useState(false)

  const handleNotifyConfirm = async () => {
    if (!notifyModal) return
    setNotifyLoading(true)
    try {
      const result = await notifySingleAwardee(event.id, notifyModal.id)
      if (result.success) {
        setNotifyModal(null)
        router.refresh()
      } else {
        alert(result.error ?? 'Failed to send notification.')
      }
    } finally {
      setNotifyLoading(false)
    }
  }

  if (winners.length === 0) return null

  const renderWinnerCard = (winner: Registration) => (
    <div
      key={winner.id}
      className={`overflow-hidden rounded-xl border shadow-sm transition hover:shadow-md ${getPositionColor(winner.position!)}`}
    >
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award
              className={`h-5 w-5 shrink-0 ${
                winner.position === 1
                  ? 'text-amber-500'
                  : winner.position === 2
                    ? 'text-slate-500'
                    : winner.position === 3
                      ? 'text-orange-600'
                      : 'text-slate-400'
              }`}
              aria-hidden
            />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {positionLabel(winner.position!)}
            </span>
          </div>
        </div>
        <h3 className="mb-1 font-semibold text-slate-900">{winner.name}</h3>
        <p className="text-sm text-slate-600">{winner.school}</p>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <Hash className="h-3 w-3" aria-hidden />
          <span>{winner.registrationId || winner.id}</span>
        </div>
        {canEdit && (
          <div className="mt-3 pt-3 border-t border-slate-200/60">
            {winner.resultNotifiedAt ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                <CheckCircle className="h-3.5 w-3.5" aria-hidden />
                <span>Notified</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setNotifyModal(winner)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700"
              >
                <Send className="h-3.5 w-3.5" aria-hidden />
                Publish
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" aria-hidden />
          <h2 className="text-lg font-semibold text-slate-900">Winners</h2>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            {winners.length}
          </span>
        </div>
        {hasCategories && winnersByCategory ? (
          <div className="space-y-8">
            {categoryOrder.map((cat) => {
              const catWinners = winnersByCategory[cat] ?? []
              if (catWinners.length === 0) return null
              return (
                <div key={cat}>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
                    {cat}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {catWinners.map(renderWinnerCard)}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {winners.map(renderWinnerCard)}
          </div>
        )}
      </section>

      {notifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-slate-900">
              Publish result for {notifyModal.name}?
            </h3>
            <p className="mb-6 text-sm text-slate-600">
              This will send an email notification to {notifyModal.email} informing them of their{' '}
              {positionLabel(notifyModal.position!)} place position in {event.title}.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setNotifyModal(null)}
                disabled={notifyLoading}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNotifyConfirm}
                disabled={notifyLoading}
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {notifyLoading ? 'Sending...' : 'Send notification'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

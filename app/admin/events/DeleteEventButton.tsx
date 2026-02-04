'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, X, AlertTriangle } from 'lucide-react'
import { deleteEvent } from '@/app/admin/actions'

interface DeleteEventButtonProps {
  eventId: string
  eventTitle: string
}

export default function DeleteEventButton({ eventId, eventTitle }: DeleteEventButtonProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDeleteClick = () => setShowModal(true)

  const handleDeleteConfirm = async () => {
    setLoading(true)
    try {
      const result = await deleteEvent(eventId)
      if (result.success) {
        setShowModal(false)
        router.push('/admin/events')
        router.refresh()
      } else {
        alert(result.error ?? 'Failed to delete')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleDeleteClick}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        Delete
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !loading && setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border-2 border-red-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Delete event</h3>
              <button
                type="button"
                onClick={() => !loading && setShowModal(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" aria-hidden />
              <div>
                <p className="font-medium text-amber-900">Move to trash</p>
                <p className="mt-1 text-sm text-amber-800">
                  <strong>{eventTitle}</strong> will be moved to trash. It can be restored by a super admin within 30 days, after which it will be permanently deleted.
                </p>
              </div>
            </div>
            <p className="mb-4 text-sm text-slate-600">
              Are you sure you want to delete this event?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={loading}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {loading ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                type="button"
                onClick={() => !loading && setShowModal(false)}
                disabled={loading}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Send, CheckCircle, Loader2 } from 'lucide-react'
import { publishEventResults } from '@/app/admin/actions'

interface PublishResultsButtonProps {
  eventId: string
  eventTitle: string
  awardeeCount: number
  resultsPublishedAt: string | null | undefined
  canEdit: boolean
}

export default function PublishResultsButton({
  eventId,
  eventTitle,
  awardeeCount,
  resultsPublishedAt,
  canEdit,
}: PublishResultsButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isPublished = !!resultsPublishedAt

  const handlePublish = async () => {
    setMessage(null)
    setLoading(true)
    try {
      const result = await publishEventResults(eventId)
      if (result.success) {
        setMessage({
          type: 'success',
          text: `Results published! Emails sent to ${result.sent ?? awardeeCount} awardee${(result.sent ?? 0) !== 1 ? 's' : ''}.`,
        })
        router.refresh()
      } else {
        setMessage({ type: 'error', text: result.error ?? 'Failed to publish results.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' })
    } finally {
      setLoading(false)
    }
  }

  if (!canEdit) return null

  if (isPublished) {
    const publishedDate = resultsPublishedAt
      ? format(new Date(resultsPublishedAt), 'MMM d, yyyy \'at\' h:mm a')
      : ''
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4">
        <CheckCircle className="h-5 w-5 text-emerald-600" aria-hidden />
        <span className="text-sm font-medium text-emerald-800">
          Results published on {publishedDate}
        </span>
      </div>
    )
  }

  if (awardeeCount === 0) {
    return (
      <p className="text-sm text-slate-500">
        Assign positions (1st–20th) to registrants, then click Publish result to notify awardees.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handlePublish}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Send className="h-4 w-4" aria-hidden />
        )}
        {loading ? 'Publishing…' : 'Publish result'}
      </button>
      <p className="text-xs text-slate-500">
        Sends congratulations emails to {awardeeCount} awardee{awardeeCount !== 1 ? 's' : ''}.
      </p>
      {message && (
        <div
          className={`rounded-xl px-3 py-2 text-sm ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}

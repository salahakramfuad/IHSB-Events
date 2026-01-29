'use client'

import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteEvent } from '@/app/admin/actions'

interface DeleteEventButtonProps {
  eventId: string
  eventTitle: string
}

export default function DeleteEventButton({ eventId, eventTitle }: DeleteEventButtonProps) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`Delete event "${eventTitle}"? This cannot be undone.`)) return
    const result = await deleteEvent(eventId)
    if (result.success) {
      router.push('/admin/events')
      router.refresh()
    } else {
      alert(result.error ?? 'Failed to delete')
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
    >
      <Trash2 className="h-4 w-4" aria-hidden />
      Delete
    </button>
  )
}

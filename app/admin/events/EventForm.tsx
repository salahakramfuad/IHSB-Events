'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createEvent, updateEvent } from '@/app/admin/actions'
import type { Event } from '@/types/event'
import { Upload, X } from 'lucide-react'

interface EventFormProps {
  event?: Event | null
}

export default function EventForm({ event }: EventFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEdit = !!event?.id
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: event?.title ?? '',
    description: event?.description ?? '',
    fullDescription: event?.fullDescription ?? '',
    date: Array.isArray(event?.date) ? event.date[0] : (event?.date as string) ?? '',
    time: event?.time ?? '',
    location: event?.location ?? '',
    venue: event?.venue ?? '',
    image: event?.image ?? '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload-image', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.url) {
        setFormData((prev) => ({ ...prev, image: data.url }))
      } else {
        setError(data.error ?? 'Upload failed')
      }
    } catch {
      setError('Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const clearImage = () => {
    setFormData((prev) => ({ ...prev, image: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isEdit && event) {
        const result = await updateEvent(event.id, {
          title: formData.title,
          description: formData.description,
          fullDescription: formData.fullDescription || undefined,
          date: formData.date,
          time: formData.time || undefined,
          location: formData.location,
          venue: formData.venue || undefined,
          image: formData.image || undefined,
        })
        if (result.success) {
          router.push('/admin/events')
          router.refresh()
        } else {
          setError(result.error ?? 'Update failed')
        }
      } else {
        const result = await createEvent({
          title: formData.title,
          description: formData.description,
          fullDescription: formData.fullDescription || undefined,
          date: formData.date,
          time: formData.time || undefined,
          location: formData.location,
          venue: formData.venue || undefined,
          image: formData.image || undefined,
        })
        if (result.success && result.id) {
          router.push('/admin/events')
          router.refresh()
        } else {
          setError(result.error ?? 'Create failed')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition'

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-slate-700">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={formData.title}
          onChange={handleChange}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-700">
          Short description <span className="text-red-500">*</span>
        </label>
        <input
          id="description"
          name="description"
          type="text"
          required
          value={formData.description}
          onChange={handleChange}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="fullDescription" className="mb-1.5 block text-sm font-medium text-slate-700">
          Full description
        </label>
        <textarea
          id="fullDescription"
          name="fullDescription"
          rows={4}
          value={formData.fullDescription}
          onChange={handleChange}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="mb-1.5 block text-sm font-medium text-slate-700">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            value={formData.date}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="time" className="mb-1.5 block text-sm font-medium text-slate-700">
            Time
          </label>
          <input
            id="time"
            name="time"
            type="text"
            value={formData.time}
            onChange={handleChange}
            className={inputClass}
            placeholder="e.g. 9:00 AM - 5:00 PM"
          />
        </div>
      </div>
      <div>
        <label htmlFor="location" className="mb-1.5 block text-sm font-medium text-slate-700">
          Location <span className="text-red-500">*</span>
        </label>
        <input
          id="location"
          name="location"
          type="text"
          required
          value={formData.location}
          onChange={handleChange}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="venue" className="mb-1.5 block text-sm font-medium text-slate-700">
          Venue
        </label>
        <input
          id="venue"
          name="venue"
          type="text"
          value={formData.venue}
          onChange={handleChange}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Event image
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          disabled={uploading}
          className="sr-only"
          id="event-image-file"
          aria-label="Upload event image"
        />
        {formData.image ? (
          <div className="space-y-2">
            <div className="relative inline-block rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
              <Image
                src={formData.image}
                alt="Event"
                width={320}
                height={180}
                className="h-40 w-auto object-cover"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute right-2 top-2 rounded-full bg-slate-900/60 p-1.5 text-white hover:bg-slate-900"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <label
              htmlFor="event-image-file"
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading…' : 'Replace image'}
            </label>
          </div>
        ) : (
          <label
            htmlFor="event-image-file"
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-8 text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600 disabled:opacity-50"
          >
            <Upload className="mb-2 h-10 w-10" />
            <span className="text-sm font-medium">
              {uploading ? 'Uploading…' : 'Click to upload image (JPEG, PNG, WebP, GIF, max 5MB)'}
            </span>
          </label>
        )}
        <p className="mt-1.5 text-xs text-slate-500">
          Image is stored in Cloudinary. Optional for events.
        </p>
      </div>
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
      )}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Saving…' : isEdit ? 'Update event' : 'Create event'}
        </button>
        <Link
          href="/admin/events"
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}

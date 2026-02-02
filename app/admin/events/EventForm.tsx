'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createEvent, updateEvent } from '@/app/admin/actions'
import type { Event } from '@/types/event'
import { Upload, X, Plus } from 'lucide-react'
import DatePicker from './DatePicker'
import TimePicker from './TimePicker'

interface EventFormProps {
  event?: Event | null
}

export default function EventForm({ event }: EventFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
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
    logo: event?.logo ?? '',
    isPaid: event?.isPaid ?? false,
    amount: event?.amount ?? 0,
  })
  const [categories, setCategories] = useState<string[]>(
    Array.isArray(event?.categories) ? [...event.categories] : []
  )
  const [categoryInput, setCategoryInput] = useState('')
  const [colorTheme, setColorTheme] = useState(
    event?.colorTheme?.startsWith('#') ? event.colorTheme : '#4f46e5'
  )

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

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setFormData((prev) => ({ ...prev, logo: data.url }))
      } else {
        setError(data.error ?? 'Logo upload failed')
      }
    } catch {
      setError('Logo upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const clearLogo = () => {
    setFormData((prev) => ({ ...prev, logo: '' }))
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  const addCategory = () => {
    const name = categoryInput.trim()
    if (!name || categories.includes(name)) return
    setCategories((prev) => [...prev, name].sort())
    setCategoryInput('')
  }

  const removeCategory = (name: string) => {
    setCategories((prev) => prev.filter((c) => c !== name))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (formData.isPaid && (!formData.amount || formData.amount <= 0)) {
      setError('For paid events, amount must be greater than 0.')
      return
    }
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
          logo: formData.logo || undefined,
          categories: categories.length > 0 ? categories : undefined,
          colorTheme: colorTheme || undefined,
          isPaid: formData.isPaid || undefined,
          amount: formData.isPaid ? formData.amount : undefined,
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
          logo: formData.logo || undefined,
          categories: categories.length > 0 ? categories : undefined,
          colorTheme: colorTheme || undefined,
          isPaid: formData.isPaid || undefined,
          amount: formData.isPaid ? formData.amount : undefined,
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Date <span className="text-red-500">*</span>
          </label>
          <DatePicker
            value={formData.date}
            onChange={(date) => {
              setFormData((prev) => ({ ...prev, date }))
              setError('')
            }}
            disabled={loading}
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Time
          </label>
          <TimePicker
            value={formData.time}
            onChange={(time) => {
              setFormData((prev) => ({ ...prev, time }))
              setError('')
            }}
            disabled={loading}
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
          Payment
        </label>
        <p className="mb-2 text-xs text-slate-500">
          If paid, registrants must complete bKash payment to confirm registration.
        </p>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isPaid}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, isPaid: e.target.checked }))
                setError('')
              }}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-slate-700">Paid event</span>
          </label>
        </div>
        {formData.isPaid && (
          <div className="mt-3">
            <label htmlFor="amount" className="mb-1.5 block text-sm font-medium text-slate-700">
              Amount (BDT) <span className="text-red-500">*</span>
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              min={1}
              required={formData.isPaid}
              value={formData.amount || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                setFormData((prev) => ({ ...prev, amount: isNaN(val) ? 0 : val }))
                setError('')
              }}
              className={inputClass}
              placeholder="e.g. 500"
            />
          </div>
        )}
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          PDF color theme
        </label>
        <p className="mb-2 text-xs text-slate-500">
          Color applied to registration PDFs (bars, badges, accents). Choose any color.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <input
              type="color"
              value={colorTheme.startsWith('#') ? colorTheme : '#4f46e5'}
              onChange={(e) => setColorTheme(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-lg border-0 bg-transparent p-0"
              title="Pick a color"
            />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">Custom color</span>
              <input
                type="text"
                value={colorTheme}
                onChange={(e) => setColorTheme(e.target.value)}
                placeholder="#4f46e5"
                className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 font-mono text-sm text-slate-900"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {['#4f46e5', '#7c3aed', '#2563eb', '#059669', '#d97706', '#e11d48'].map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => setColorTheme(hex)}
                className={`h-9 w-9 rounded-xl border-2 transition ${
                  colorTheme === hex ? 'border-slate-600 scale-110' : 'border-slate-200 hover:border-slate-400'
                }`}
                style={{ backgroundColor: hex }}
                title={hex}
              />
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Categories
        </label>
        <p className="mb-2 text-xs text-slate-500">
          If you add categories, registrants must choose one when registering (e.g. Photography, Essay, Debate).
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={categoryInput}
            onChange={(e) => setCategoryInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
            placeholder="e.g. Photography"
            className={inputClass}
            aria-label="New category name"
          />
          <button
            type="button"
            onClick={addCategory}
            className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Plus className="h-5 w-5" aria-hidden />
          </button>
        </div>
        {categories.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {categories.map((name) => (
              <li
                key={name}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
              >
                {name}
                <button
                  type="button"
                  onClick={() => removeCategory(name)}
                  className="rounded-full p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                  aria-label={`Remove category ${name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
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
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Event logo
        </label>
        <p className="mb-2 text-xs text-slate-500">
          Square logo for the event. If not set, event initials (e.g. &quot;SC&quot; for Super Cup) are shown.
        </p>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleLogoChange}
          disabled={uploading}
          className="sr-only"
          id="event-logo-file"
          aria-label="Upload event logo"
        />
        {formData.logo ? (
          <div className="space-y-2">
            <div className="relative inline-block rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
              <Image
                src={formData.logo}
                alt="Event logo"
                width={80}
                height={80}
                className="h-20 w-20 object-cover"
              />
              <button
                type="button"
                onClick={clearLogo}
                className="absolute right-1 top-1 rounded-full bg-slate-900/60 p-1 text-white hover:bg-slate-900"
                aria-label="Remove logo"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <label
              htmlFor="event-logo-file"
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading…' : 'Replace logo'}
            </label>
          </div>
        ) : (
          <label
            htmlFor="event-logo-file"
            className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600 disabled:opacity-50"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-100 font-bold text-amber-700">
              {formData.title.trim()
                ? formData.title.trim().split(/\s+/).filter(Boolean).length >= 2
                  ? formData.title.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
                  : formData.title.trim().slice(0, 2).toUpperCase()
                : '?'}
            </div>
            <span className="text-sm font-medium">
              {uploading ? 'Uploading…' : 'Click to upload logo (square, max 5MB)'}
            </span>
          </label>
        )}
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

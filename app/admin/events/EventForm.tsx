'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createEvent, updateEvent } from '@/app/admin/actions'
import type { Event } from '@/types/event'
import {
  Upload,
  X,
  Plus,
  FileText,
  CalendarDays,
  MapPin,
  ImageIcon,
  CreditCard,
  Palette,
  Tag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import DatePicker from './DatePicker'
import TimePicker from './TimePicker'

interface EventFormProps {
  event?: Event | null
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition'

function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  collapsible = true,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  defaultOpen?: boolean
  collapsible?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const showToggle = collapsible

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-visible">
      {showToggle ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50/50 transition-colors"
        >
          <span className="flex items-center gap-2.5 text-sm font-semibold text-slate-800">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Icon className="h-4 w-4" />
            </span>
            {title}
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>
      ) : (
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-slate-800">{title}</span>
        </div>
      )}
      {isOpen && <div className="px-4 py-4">{children}</div>}
    </section>
  )
}

function FormField({
  label,
  htmlFor,
  required,
  hint,
  compact,
  children,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  hint?: string
  compact?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-slate-700"
      >
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {children}
    </div>
  )
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
    date:
      Array.isArray(event?.date) ? event.date[0] : (event?.date as string) ?? '',
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
  const [categoryAmounts, setCategoryAmounts] = useState<Record<string, number>>(
    () => {
      const cats = Array.isArray(event?.categories) ? event.categories : []
      const existing = event?.categoryAmounts
      const fallback = typeof event?.amount === 'number' ? event.amount : 0
      const out: Record<string, number> = {}
      for (const c of cats) {
        out[c] =
          existing && typeof existing[c] === 'number' ? existing[c] : fallback
      }
      return out
    }
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
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: form,
      })
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
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: form,
      })
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
    setCategoryAmounts((prev) => ({ ...prev, [name]: formData.amount || 0 }))
    setCategoryInput('')
  }

  const removeCategory = (name: string) => {
    setCategories((prev) => prev.filter((c) => c !== name))
    setCategoryAmounts((prev) => {
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  const setCategoryAmount = (name: string, value: number) => {
    setCategoryAmounts((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (formData.isPaid) {
      if (categories.length > 0) {
        const missing = categories.filter(
          (c) => typeof categoryAmounts[c] !== 'number' || categoryAmounts[c] < 0
        )
        if (missing.length > 0) {
          setError('For paid events with categories, set an amount (0 or more) for each category.')
          return
        }
      } else if (!formData.amount || formData.amount <= 0) {
        setError('For paid events, amount must be greater than 0.')
        return
      }
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
          categoryAmounts:
            formData.isPaid && categories.length > 0
              ? Object.fromEntries(
                  categories.map((c) => [c, categoryAmounts[c] ?? 0])
                )
              : undefined,
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
          categoryAmounts:
            formData.isPaid && categories.length > 0
              ? Object.fromEntries(
                  categories.map((c) => [c, categoryAmounts[c] ?? 0])
                )
              : undefined,
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

  const sectionGap = isEdit ? 'space-y-4' : 'space-y-6'
  const collapsible = !isEdit

  return (
    <form onSubmit={handleSubmit} className="pb-28">
      <div className={`${sectionGap}`}>
        {/* Basic Info */}
        <Section title="Basic Information" icon={FileText} collapsible={collapsible} defaultOpen={true}>
          <div className={isEdit ? 'space-y-4' : 'space-y-5'}>
            <FormField label="Event title" htmlFor="title" required>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                className={inputClass}
                placeholder="e.g. IHSB Annual Sports Day 2025"
              />
            </FormField>
            <FormField
              label="Short description"
              htmlFor="description"
              required
              hint="Brief summary shown in event listings (1-2 sentences)"
            >
              <input
                id="description"
                name="description"
                type="text"
                required
                value={formData.description}
                onChange={handleChange}
                className={inputClass}
                placeholder="e.g. Join us for our annual sports competition"
              />
            </FormField>
            <FormField
              label="Full description"
              htmlFor="fullDescription"
              hint="Optional. Longer details shown on the event page"
            >
              <textarea
                id="fullDescription"
                name="fullDescription"
                rows={4}
                value={formData.fullDescription}
                onChange={handleChange}
                className={inputClass}
                placeholder="Add event details, schedule, rules, etc."
              />
            </FormField>
          </div>
        </Section>

        {/* Date & Time */}
        <Section title="Date & Time" icon={CalendarDays} collapsible={collapsible} defaultOpen={true}>
          <div className={`grid gap-4 sm:grid-cols-2 ${isEdit ? '' : 'gap-5'}`}>
            <FormField label="Date" required>
              <DatePicker
                value={formData.date}
                onChange={(date) => {
                  setFormData((prev) => ({ ...prev, date }))
                  setError('')
                }}
                disabled={loading}
                required
              />
            </FormField>
            <FormField label="Time" hint="Event start and end time">
              <TimePicker
                value={formData.time}
                onChange={(time) => {
                  setFormData((prev) => ({ ...prev, time }))
                  setError('')
                }}
                disabled={loading}
              />
            </FormField>
          </div>
        </Section>

        {/* Location */}
        <Section title="Location" icon={MapPin} collapsible={collapsible} defaultOpen={true}>
          <div className={isEdit ? 'space-y-4' : 'space-y-5'}>
            <FormField label="Location" htmlFor="location" required>
              <input
                id="location"
                name="location"
                type="text"
                required
                value={formData.location}
                onChange={handleChange}
                className={inputClass}
                placeholder="e.g. Dhaka, Bangladesh"
              />
            </FormField>
            <FormField
              label="Venue"
              htmlFor="venue"
              hint="Specific venue or building name"
            >
              <input
                id="venue"
                name="venue"
                type="text"
                value={formData.venue}
                onChange={handleChange}
                className={inputClass}
                placeholder="e.g. IHSB Main Hall"
              />
            </FormField>
          </div>
        </Section>

        {/* Media */}
        <Section title="Media" icon={ImageIcon} collapsible={collapsible} defaultOpen={!!(formData.image || formData.logo) || isEdit}>
          <div className={isEdit ? 'space-y-5' : 'space-y-6'}>
            <div>
              <FormField
                label="Cover image"
                hint="Main banner image for the event (JPEG, PNG, WebP, GIF)"
              >
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
                  <div className="space-y-3">
                    <div className="relative inline-block overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      <Image
                        src={formData.image}
                        alt="Event"
                        width={320}
                        height={180}
                        className="h-40 w-auto max-w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute right-2 top-2 rounded-full bg-slate-900/60 p-1.5 text-white hover:bg-slate-900 transition-colors"
                        aria-label="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <label
                      htmlFor="event-image-file"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      <Upload className="h-4 w-4" />
                      {uploading ? 'Uploading…' : 'Replace image'}
                    </label>
                  </div>
                ) : (
                  <label
                    htmlFor="event-image-file"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-10 text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600 disabled:opacity-50"
                  >
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200/60">
                      <ImageIcon className="h-6 w-6 text-slate-400" />
                    </div>
                    <span className="text-sm font-medium">
                      {uploading ? 'Uploading…' : 'Click to upload or drag and drop'}
                    </span>
                    <span className="mt-1 text-xs">JPEG, PNG, WebP, GIF · max 5MB</span>
                  </label>
                )}
              </FormField>
            </div>

            <div>
              <FormField
                label="Event logo"
                hint="Square logo. Fallback: event initials (e.g. SC for Super Cup)"
              >
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
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="relative inline-block overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
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
                        className="absolute right-1 top-1 rounded-full bg-slate-900/60 p-1 text-white hover:bg-slate-900 transition-colors"
                        aria-label="Remove logo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <label
                      htmlFor="event-logo-file"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      <Upload className="h-4 w-4" />
                      {uploading ? 'Uploading…' : 'Replace logo'}
                    </label>
                  </div>
                ) : (
                  <label
                    htmlFor="event-logo-file"
                    className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-5 py-4 text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600 disabled:opacity-50"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-100 font-bold text-amber-700">
                      {formData.title.trim()
                        ? formData.title.trim().split(/\s+/).filter(Boolean).length >= 2
                          ? formData.title
                              .trim()
                              .split(/\s+/)
                              .map((w) => w[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()
                          : formData.title.trim().slice(0, 2).toUpperCase()
                        : '?'}
                    </div>
                    <span className="text-sm font-medium">
                      {uploading ? 'Uploading…' : 'Upload logo (optional)'}
                    </span>
                  </label>
                )}
              </FormField>
            </div>
          </div>
        </Section>

        {/* Categories */}
        <Section title="Categories" icon={Tag} collapsible={collapsible} defaultOpen={categories.length > 0 || isEdit}>
          <div className="space-y-4">
            <FormField
              label="Registration categories"
              hint="Registrants pick one (e.g. Photography, Essay, Debate). Leave empty for no categories."
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && (e.preventDefault(), addCategory())
                  }
                  placeholder="e.g. Photography"
                  className={inputClass}
                  aria-label="New category name"
                />
                <button
                  type="button"
                  onClick={addCategory}
                  className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 transition hover:bg-slate-50"
                  title="Add category"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </FormField>
            {categories.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {categories.map((name) => (
                  <li
                    key={name}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => removeCategory(name)}
                      className="rounded-full p-0.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
                      aria-label={`Remove category ${name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>

        {/* Registration & Payment */}
        <Section title="Registration & Payment" icon={CreditCard} collapsible={collapsible} defaultOpen={formData.isPaid || isEdit}>
          <div className={isEdit ? 'space-y-4' : 'space-y-5'}>
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.isPaid}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, isPaid: e.target.checked }))
                    setError('')
                  }}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  <span className="text-sm font-medium text-slate-900">
                    Paid event
                  </span>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Registrants will pay via bKash to confirm their registration.
                  </p>
                </span>
              </label>
            </div>
            {formData.isPaid && categories.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700">
                  Amount per category (BDT)
                </p>
                <p className="text-xs text-slate-500">
                  Set 0 for free categories. Each category can have a different fee.
                </p>
                <div className="space-y-3">
                  {categories.map((cat) => (
                    <div key={cat} className="flex items-center gap-3">
                      <label
                        htmlFor={`amount-${cat}`}
                        className="w-40 shrink-0 text-sm text-slate-600"
                      >
                        {cat}
                      </label>
                      <input
                        id={`amount-${cat}`}
                        type="number"
                        min={0}
                        value={
                          typeof categoryAmounts[cat] === 'number'
                            ? categoryAmounts[cat]
                            : ''
                        }
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10)
                          setCategoryAmount(cat, isNaN(val) ? 0 : val)
                          setError('')
                        }}
                        className={inputClass}
                        placeholder="0"
                      />
                      <span className="text-sm text-slate-500">BDT</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {formData.isPaid && categories.length === 0 && (
              <FormField
                label="Amount (BDT)"
                htmlFor="amount"
                required
                hint="Registration fee in Bangladeshi Taka"
              >
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min={1}
                  required={formData.isPaid}
                  value={formData.amount || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10)
                    setFormData((prev) => ({
                      ...prev,
                      amount: isNaN(val) ? 0 : val,
                    }))
                    setError('')
                  }}
                  className={inputClass}
                  placeholder="e.g. 500"
                />
              </FormField>
            )}
          </div>
        </Section>

        {/* Appearance */}
        <Section title="Appearance" icon={Palette} collapsible={true} defaultOpen={false}>
          <FormField
            label="PDF color theme"
            hint="Color for registration PDFs (bars, badges)"
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <input
                  type="color"
                  value={colorTheme.startsWith('#') ? colorTheme : '#4f46e5'}
                  onChange={(e) => setColorTheme(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                  title="Pick a color"
                />
                <input
                  type="text"
                  value={colorTheme}
                  onChange={(e) => setColorTheme(e.target.value)}
                  placeholder="#4f46e5"
                  className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 font-mono text-sm text-slate-900"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  '#4f46e5',
                  '#7c3aed',
                  '#2563eb',
                  '#059669',
                  '#d97706',
                  '#e11d48',
                ].map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setColorTheme(hex)}
                    className={`h-9 w-9 rounded-xl border-2 transition ${
                      colorTheme === hex
                        ? 'scale-110 border-slate-600'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                ))}
              </div>
            </div>
          </FormField>
        </Section>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 py-3 pl-20 backdrop-blur supports-backdrop-filter:bg-white/80 lg:pl-64">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 pr-6">
          <p className="text-sm text-slate-500">
            {isEdit ? 'Save your changes' : 'Review and create your event'}
          </p>
          <div className="flex gap-2">
            <Link
              href={isEdit ? `/admin/events/${event?.id}` : '/admin/events'}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {isEdit ? 'Back' : 'Cancel'}
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white text-sm shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create event'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

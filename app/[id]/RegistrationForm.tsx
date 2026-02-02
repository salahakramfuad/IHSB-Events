'use client'

import { useState } from 'react'
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react'

interface RegistrationFormProps {
  eventId: string
  /** If set, registrant must choose one category */
  categories?: string[]
  /** If true, registration requires bKash payment */
  isPaid?: boolean
  /** Amount in BDT (shown when isPaid) */
  amount?: number
}

export default function RegistrationForm({ eventId, categories = [], isPaid, amount }: RegistrationFormProps) {
  const hasCategories = Array.isArray(categories) && categories.length > 0
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'redirecting'>('idle')
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    school: '',
    note: '',
    category: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (status === 'error') setStatus('idle')
  }

  const validate = (): string | null => {
    if (!formData.name.trim()) return 'Name is required.'
    if (!formData.email.trim()) return 'Email is required.'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email.trim())) return 'Please enter a valid email.'
    if (!formData.phone.trim()) return 'Phone is required.'
    if (!formData.school.trim()) return 'School is required.'
    if (hasCategories && !formData.category.trim()) return 'Please select a category.'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) {
      setStatus('error')
      setMessage(err)
      return
    }
    setStatus('loading')
    setMessage('')
    try {
      if (isPaid && amount != null && amount > 0) {
        setStatus('redirecting')
        setMessage('Redirecting to bKash…')
        const clientGeneratedId = `P${Date.now()}${Math.random().toString(36).slice(2, 8)}`
        const registrationData = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          school: formData.school.trim(),
          note: formData.note.trim() || '',
          category: hasCategories ? formData.category.trim() || '' : '',
        }
        const payRes = await fetch('/api/bkash/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId, clientGeneratedId, registrationData }),
        })
        const payData = await payRes.json().catch(() => ({}))
        if (payRes.ok && payData.bkashURL) {
          try {
            sessionStorage.setItem('bkash_eventId', eventId)
            sessionStorage.setItem('bkash_registrationData', JSON.stringify(registrationData))
          } catch {
            /* ignore */
          }
          window.location.href = payData.bkashURL
        } else {
          setStatus('error')
          setMessage(payData.error ?? 'Failed to create payment')
        }
      } else {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            school: formData.school.trim(),
            note: formData.note.trim() || undefined,
            category: hasCategories ? formData.category.trim() || undefined : undefined,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.success) {
          setStatus('success')
          setMessage('Registration successful! Check your email for confirmation.')
          setFormData({ name: '', email: '', phone: '', school: '', note: '', category: '' })
        } else {
          setStatus('error')
          setMessage(data.error || `Request failed (${res.status}).`)
        }
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-[hsl(var(--event-accent))] focus:ring-2 focus:ring-[hsl(var(--event-accent)/0.2)] transition'

  if (status === 'success') {
    return (
      <div className="sticky top-24 rounded-2xl border-2 border-emerald-200/80 bg-white/95 p-8 shadow-sm backdrop-blur text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-4 ring-emerald-100/80">
          <CheckCircle className="h-12 w-12" aria-hidden />
        </div>
        <h3 className="text-2xl font-bold text-slate-900">You&apos;re registered!</h3>
        <p className="mt-3 text-slate-600 leading-relaxed">
          Check your email for confirmation. We look forward to seeing you at the event.
        </p>
        <p className="mt-5 text-sm text-slate-500">
          Reload the page if you need to register again.
        </p>
      </div>
    )
  }

  return (
    <div className="sticky top-24 rounded-2xl bg-white/95 p-6 shadow-sm backdrop-blur">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--event-accent)/0.2)] text-[hsl(var(--event-accent))]">
          <UserPlus className="h-5 w-5" aria-hidden />
        </span>
        <h3 className="text-lg font-semibold text-slate-900">Register for this event</h3>
      </div>
      {isPaid && amount != null && amount > 0 && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800">
          Registration fee: ৳{amount} BDT (pay via bKash)
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {hasCategories && (
          <div>
            <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-slate-700">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              required
              value={formData.category}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, category: e.target.value }))
                if (status === 'error') setStatus('idle')
              }}
              className={inputClass}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            className={inputClass}
            placeholder="Your full name"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-slate-700">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            value={formData.phone}
            onChange={handleChange}
            className={inputClass}
            placeholder="01XXXXXXXXX"
          />
        </div>
        <div>
          <label htmlFor="school" className="mb-1.5 block text-sm font-medium text-slate-700">
            School <span className="text-red-500">*</span>
          </label>
          <input
            id="school"
            name="school"
            type="text"
            required
            value={formData.school}
            onChange={handleChange}
            className={inputClass}
            placeholder="School name"
          />
        </div>
        <div>
          <label htmlFor="note" className="mb-1.5 block text-sm font-medium text-slate-700">
            Note <span className="text-slate-400">(optional)</span>
          </label>
          <textarea
            id="note"
            name="note"
            rows={2}
            value={formData.note}
            onChange={handleChange}
            className={inputClass}
            placeholder="Any additional information"
          />
        </div>
        {message && status === 'error' && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-800">
            <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
            <span>{message}</span>
          </div>
        )}
        <button
          type="submit"
          disabled={status === 'loading' || status === 'redirecting'}
          className="w-full rounded-full bg-[hsl(var(--event-accent))] px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'redirecting'
            ? 'Redirecting to bKash…'
            : status === 'loading'
              ? 'Registering…'
              : isPaid && amount != null && amount > 0
                ? `Register - ৳${Number(amount) % 1 === 0 ? amount : Number(amount).toFixed(2)} BDT`
                : 'Register'}
        </button>
      </form>
    </div>
  )
}

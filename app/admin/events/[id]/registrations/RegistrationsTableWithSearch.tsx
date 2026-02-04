'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Search, Users, Send, CheckCircle, Pencil, FileDown, Download, FileStack, Trash2, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import type { Registration } from '@/types/registration'
import type { Event } from '@/types/event'
import { updateRegistrationPosition, notifySingleAwardee, updateRegistration, deleteRegistration } from '@/app/admin/actions'
import { generateRegistrationPDF, generateAllRegistrationsPDF } from '@/lib/generateRegistrationPDF'
import SchoolCombobox from '@/components/SchoolCombobox'

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
  const category = (reg.category ?? '').toLowerCase()
  return (
    name.includes(lower) ||
    email.includes(lower) ||
    phone.includes(lower) ||
    school.includes(lower) ||
    note.includes(lower) ||
    regId.includes(lower) ||
    category.includes(lower)
  )
}

interface RegistrationsTableWithSearchProps {
  eventId: string
  event: Event
  registrations: Registration[]
  canEdit: boolean
  isSuperAdmin: boolean
  eventCategories?: string[]
}

export default function RegistrationsTableWithSearch({
  eventId,
  event,
  registrations,
  canEdit,
  isSuperAdmin,
  eventCategories = [],
}: RegistrationsTableWithSearchProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterPosition, setFilterPosition] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterNotified, setFilterNotified] = useState<string>('all')
  const [filterPayment, setFilterPayment] = useState<string>('all')
  const isPaidEvent = !!event.isPaid
  const [pending, startTransition] = useTransition()
  const [notifyModal, setNotifyModal] = useState<Registration | null>(null)
  const [notifyLoading, setNotifyLoading] = useState(false)
  const [editModal, setEditModal] = useState<Registration | null>(null)
  const [editSchoolValue, setEditSchoolValue] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [deleteModal, setDeleteModal] = useState<Registration | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const filtered = useMemo(() => {
    return registrations.filter((reg) => {
      if (!matchSearch(reg, search)) return false
      if (filterPosition !== 'all') {
        if (filterPosition === 'none') {
          if (reg.position != null) return false
        } else {
          const pos = parseInt(filterPosition, 10)
          if (reg.position !== pos) return false
        }
      }
      if (filterCategory !== 'all' && (reg.category ?? '') !== filterCategory) return false
      if (filterNotified !== 'all') {
        const notified = !!reg.resultNotifiedAt
        if (filterNotified === 'yes' && !notified) return false
        if (filterNotified === 'no' && notified) return false
      }
      if (isPaidEvent && filterPayment !== 'all') {
        const status = reg.paymentStatus ?? 'completed'
        if (filterPayment === 'pending' && status !== 'pending') return false
        if (filterPayment === 'completed' && status !== 'completed') return false
      }
      return true
    })
  }, [registrations, search, filterPosition, filterCategory, filterNotified, filterPayment, isPaidEvent])

  const handlePositionChange = (registrationDocId: string, value: string) => {
    const position = value === '' ? null : parseInt(value, 10)
    if (position !== null && (position < 1 || position > 20)) return
    startTransition(async () => {
      await updateRegistrationPosition(eventId, registrationDocId, position)
    })
  }

  const handleNotifyClick = (reg: Registration) => {
    setNotifyModal(reg)
  }

  const handleNotifyConfirm = async () => {
    if (!notifyModal) return
    setNotifyLoading(true)
    try {
      const result = await notifySingleAwardee(eventId, notifyModal.id)
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

  const positionLabel = (n: number) =>
    n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`

  const getAmountForReg = (reg: Registration): number => {
    if (!isPaidEvent) return 0
    if (reg.paymentStatus !== 'completed') return 0
    const cats = event.categories
    const catAmounts = event.categoryAmounts
    if (Array.isArray(cats) && cats.length > 0 && catAmounts && reg.category) {
      return typeof catAmounts[reg.category] === 'number' ? catAmounts[reg.category]! : (event.amount ?? 0)
    }
    return typeof event.amount === 'number' ? event.amount : 0
  }

  const handleExportExcel = () => {
    const rows = filtered.map((reg) => {
      const base = {
        Position: reg.position != null ? positionLabel(reg.position) : '',
        Name: reg.name ?? '',
        Email: reg.email ?? '',
        Phone: reg.phone ?? '',
        School: reg.school ?? '',
        Category: reg.category ?? '',
        Note: reg.note ?? '',
        'Registration ID': reg.registrationId ?? reg.id ?? '',
        Notified: reg.resultNotifiedAt ? 'Yes' : 'No',
        'Registered At': reg.createdAt
          ? format(new Date(reg.createdAt), 'MMM d, yyyy h:mm a')
          : '',
      }
      if (isPaidEvent) {
        return {
          ...base,
          'Amount (BDT)': getAmountForReg(reg),
          'Payment Status': reg.paymentStatus === 'pending' ? 'Pending' : 'Completed',
          'bKash Trx ID': reg.bkashTrxId ?? '',
        }
      }
      return base
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Registrations')
    const filename = `${event.title.replace(/[^a-z0-9]/gi, '_')}_registrations.xlsx`
    XLSX.writeFile(wb, filename)
  }

  const [downloadingAllPDFs, setDownloadingAllPDFs] = useState(false)

  const handleDownloadPDF = async (registration: Registration) => {
    try {
      await generateRegistrationPDF({
        event,
        registration,
        logoUrl: event.logo,
      })
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  const handleDownloadAllPDFs = async () => {
    if (filtered.length === 0) return
    setDownloadingAllPDFs(true)
    try {
      await generateAllRegistrationsPDF({
        event,
        registrations: filtered,
        logoUrl: event.logo,
      })
    } catch (error) {
      console.error('Failed to generate combined PDF:', error)
      alert('Failed to generate combined PDF. Please try again.')
    } finally {
      setDownloadingAllPDFs(false)
    }
  }

  const handleEditClick = (reg: Registration) => {
    setEditModal(reg)
    setEditSchoolValue(reg.school ?? '')
  }

  const handleDeleteClick = (reg: Registration) => {
    setDeleteModal(reg)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal) return
    setDeleteLoading(true)
    try {
      const result = await deleteRegistration(eventId, deleteModal.id)
      if (result.success) {
        setDeleteModal(null)
        router.refresh()
      } else {
        alert(result.error ?? 'Failed to delete registration.')
      }
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!editModal) return
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      school: formData.get('school') as string,
      note: (formData.get('note') as string) || '',
      category: eventCategories.length > 0 ? (formData.get('category') as string) || '' : undefined,
    }
    setEditLoading(true)
    try {
      const result = await updateRegistration(eventId, editModal.id, data)
      if (result.success) {
        setEditModal(null)
        router.refresh()
      } else {
        alert(result.error ?? 'Failed to update registration.')
      }
    } finally {
      setEditLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

  return (
    <>
      <div className="mb-4 space-y-3">
        <div>
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
              placeholder="Search by name, email, phone, school, category, note, or registration ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            aria-label="Filter by position"
          >
            <option value="all">All positions</option>
            <option value="none">No position</option>
            {POSITION_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`}
              </option>
            ))}
          </select>
          {eventCategories.length > 0 && (
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              aria-label="Filter by category"
            >
              <option value="all">All categories</option>
              {eventCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
          <select
            value={filterNotified}
            onChange={(e) => setFilterNotified(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            aria-label="Filter by notified status"
          >
            <option value="all">All</option>
            <option value="yes">Notified</option>
            <option value="no">Not yet notified</option>
          </select>
          {isPaidEvent && (
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              aria-label="Filter by payment status"
            >
              <option value="all">All payments</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          )}
          {(search.trim() || filterPosition !== 'all' || filterCategory !== 'all' || filterNotified !== 'all' || (isPaidEvent && filterPayment !== 'all')) && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setFilterPosition('all')
                setFilterCategory('all')
                setFilterNotified('all')
                setFilterPayment('all')
              }}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Clear filters
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Showing {filtered.length} of {registrations.length} applicants
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadAllPDFs}
              disabled={filtered.length === 0 || downloadingAllPDFs}
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileStack className="h-4 w-4" />
              {downloadingAllPDFs ? 'Generating...' : 'Download All PDFs'}
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown className="h-4 w-4" />
              Download Excel
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-700">Registration list</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-max min-w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Position
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Name
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Category
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
              {isPaidEvent && (
                <>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Amount
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Payment
                  </th>
                </>
              )}
              {canEdit && (
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Publish
                </th>
              )}
              {isSuperAdmin && (
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Edit
                </th>
              )}
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                PDF
              </th>
              {isSuperAdmin && (
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Delete
                </th>
              )}
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
                <td className="px-5 py-4 text-sm text-slate-600">{reg.category ?? '—'}</td>
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
                {isPaidEvent && (
                  <>
                    <td className="px-5 py-4 text-right text-sm font-medium text-slate-900">
                      ৳{getAmountForReg(reg).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        reg.paymentStatus === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {reg.paymentStatus === 'pending' ? 'Pending' : 'Completed'}
                    </span>
                    {reg.bkashTrxId && (
                      <span className="ml-1.5 block text-xs text-slate-500" title="bKash transaction ID">
                        {reg.bkashTrxId}
                      </span>
                    )}
                  </td>
                  </>
                )}
                {canEdit && (
                  <td className="px-5 py-4">
                    {reg.position != null && reg.position >= 1 && reg.position <= 20 ? (
                      reg.resultNotifiedAt ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600">
                          <CheckCircle className="h-4 w-4" />
                          Notified
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleNotifyClick(reg)}
                          disabled={!!pending}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Publish
                        </button>
                      )
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                )}
                {isSuperAdmin && (
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => handleEditClick(reg)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </td>
                )}
                <td className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(reg)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
                    title="Download registration certificate"
                  >
                    <Download className="h-3.5 w-3.5" />
                    PDF
                  </button>
                </td>
                {isSuperAdmin && (
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(reg)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
                      title="Delete registration"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </td>
                )}
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
      </div>

      {/* Edit registration modal */}
      {editModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !editLoading && setEditModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900">Edit registration</h3>
            <p className="mt-1 text-sm text-slate-500">
              Update student info for this event registration.
            </p>
            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="edit-name" className="mb-1 block text-sm font-medium text-slate-700">
                  Name *
                </label>
                <input
                  id="edit-name"
                  name="name"
                  type="text"
                  required
                  defaultValue={editModal.name}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="edit-email" className="mb-1 block text-sm font-medium text-slate-700">
                  Email *
                </label>
                <input
                  id="edit-email"
                  name="email"
                  type="email"
                  required
                  defaultValue={editModal.email}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="edit-phone" className="mb-1 block text-sm font-medium text-slate-700">
                  Phone *
                </label>
                <input
                  id="edit-phone"
                  name="phone"
                  type="tel"
                  required
                  defaultValue={editModal.phone}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="edit-school" className="mb-1 block text-sm font-medium text-slate-700">
                  School *
                </label>
                <input type="hidden" name="school" value={editSchoolValue} />
                <SchoolCombobox
                  id="edit-school"
                  value={editSchoolValue}
                  onChange={setEditSchoolValue}
                  placeholder="Select or type school name"
                  required
                />
              </div>
              {eventCategories.length > 0 && (
                <div>
                  <label htmlFor="edit-category" className="mb-1 block text-sm font-medium text-slate-700">
                    Category
                  </label>
                  <select
                    id="edit-category"
                    name="category"
                    className={inputClass}
                    defaultValue={editModal.category ?? ''}
                  >
                    <option value="">—</option>
                    {eventCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label htmlFor="edit-note" className="mb-1 block text-sm font-medium text-slate-700">
                  Note
                </label>
                <textarea
                  id="edit-note"
                  name="note"
                  rows={2}
                  defaultValue={editModal.note ?? ''}
                  className={inputClass}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => !editLoading && setEditModal(null)}
                  disabled={editLoading}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  {editLoading ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete registration modal */}
      {deleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !deleteLoading && setDeleteModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border-2 border-red-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Delete registration</h3>
              <button
                type="button"
                onClick={() => !deleteLoading && setDeleteModal(null)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="font-medium text-amber-900">Warning</p>
              <p className="mt-1 text-sm text-amber-800">
                This will permanently delete the registration for <strong>{deleteModal.name}</strong> ({deleteModal.email}).
                This action cannot be undone.
              </p>
              <p className="mt-2 text-sm text-amber-700">
                The registration will be moved to trash (restorable within 30 days). The registree will be notified by email with event contact details.
              </p>
            </div>
            <p className="mb-4 text-sm text-slate-600">
              Are you sure you want to delete this registration?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {deleteLoading ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                type="button"
                onClick={() => !deleteLoading && setDeleteModal(null)}
                disabled={deleteLoading}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notify confirmation modal */}
      {notifyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !notifyLoading && setNotifyModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900">Publish result</h3>
            <p className="mt-2 text-slate-600">
              Send result notification email to <strong>{notifyModal.name}</strong>? They secured{' '}
              <strong>{positionLabel(notifyModal.position!)}</strong> position in &quot;{event.title}&quot;.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Email will be sent to: {notifyModal.email}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => !notifyLoading && setNotifyModal(null)}
                disabled={notifyLoading}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNotifyConfirm}
                disabled={notifyLoading}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {notifyLoading ? 'Sending…' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

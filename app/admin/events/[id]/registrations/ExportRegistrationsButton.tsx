'use client'

import type { Registration } from '@/types/registration'
import type { Event } from '@/types/event'
import { format } from 'date-fns'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'

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

function toExcelRows(event: Event, registrations: Registration[]): Record<string, string | number>[] {
  return registrations.map((r) => {
    const base: Record<string, string | number> = {
      Position: r.position != null ? (r.position === 1 ? '1st' : r.position === 2 ? '2nd' : r.position === 3 ? '3rd' : `${r.position}th`) : '',
      Name: r.name,
      Category: r.category ?? '',
      Email: r.email,
      Phone: r.phone,
      School: r.school,
      Note: r.note ?? '',
      'Registration ID': r.registrationId ?? r.id,
      'Registered At':
        typeof r.createdAt === 'string'
          ? format(new Date(r.createdAt), 'yyyy-MM-dd HH:mm')
          : '',
    }
    if (event.isPaid) {
      base['Amount (BDT)'] = getAmountForReg(event, r)
      base['Payment Status'] = r.paymentStatus === 'pending' ? 'Pending' : 'Completed'
      base['bKash Trx ID'] = r.bkashTrxId ?? ''
    }
    return base
  })
}

interface ExportRegistrationsButtonProps {
  event: Event
  eventId: string
  eventTitle: string
  registrations: Registration[]
}

export default function ExportRegistrationsButton({
  event,
  eventId,
  eventTitle,
  registrations,
}: ExportRegistrationsButtonProps) {
  const handleExport = () => {
    const rows = toExcelRows(event, registrations)
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Registrations')
    const safeTitle = eventTitle.replace(/[\\/*?:\[\]]/g, '-').slice(0, 30)
    const filename = `registrations-${safeTitle}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
    XLSX.writeFile(wb, filename)
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
    >
      <Download className="h-4 w-4" aria-hidden />
      Download Excel
    </button>
  )
}

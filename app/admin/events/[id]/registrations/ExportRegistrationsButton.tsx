'use client'

import type { Registration } from '@/types/registration'
import { format } from 'date-fns'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'

function toExcelRows(registrations: Registration[]): Record<string, string | number>[] {
  return registrations.map((r) => ({
    Name: r.name,
    Email: r.email,
    Phone: r.phone,
    School: r.school,
    Note: r.note ?? '',
    'Registration ID': r.registrationId ?? r.id,
    'Registered At':
      typeof r.createdAt === 'string'
        ? format(new Date(r.createdAt), 'yyyy-MM-dd HH:mm')
        : '',
  }))
}

interface ExportRegistrationsButtonProps {
  eventId: string
  eventTitle: string
  registrations: Registration[]
}

export default function ExportRegistrationsButton({
  eventId,
  eventTitle,
  registrations,
}: ExportRegistrationsButtonProps) {
  const handleExport = () => {
    const rows = toExcelRows(registrations)
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

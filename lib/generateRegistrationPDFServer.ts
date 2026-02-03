/**
 * Server-side PDF generation for email attachments.
 * Returns Buffer instead of triggering browser download.
 */
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import type { Event } from '@/types/event'
import type { Registration } from '@/types/registration'
import { formatEventDates, parseEventDates } from './dateUtils'
import { getTheme } from './generateRegistrationPDF'

async function loadImageAsBase64Node(url: string): Promise<string> {
  const fullUrl = url.startsWith('/') ? `${process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || 'https://ihsb-events.vercel.app'}${url}` : url
  const res = await fetch(fullUrl)
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`)
  const arrayBuffer = await res.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')
  const contentType = res.headers.get('content-type') || 'image/png'
  return `data:${contentType};base64,${base64}`
}

interface GenerateRegistrationPDFBufferProps {
  event: Event
  registration: Registration
  logoUrl?: string
}

export async function generateRegistrationPDFAsBuffer({
  event,
  registration,
  logoUrl,
}: GenerateRegistrationPDFBufferProps): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - 2 * margin
  const theme = getTheme(event)

  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  doc.setFillColor(theme.primary[0], theme.primary[1], theme.primary[2])
  doc.rect(0, 0, pageWidth, 6, 'F')

  let yPos = 18

  const logoSize = 25
  let logoLoaded = false

  const getInitials = (title: string) =>
    title
      .split(' ')
      .filter((w) => w.length > 0)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('')

  if (logoUrl?.trim() && (logoUrl.startsWith('http') || logoUrl.startsWith('https'))) {
    try {
      const logoData = await loadImageAsBase64Node(logoUrl)
      doc.addImage(logoData, 'PNG', margin, yPos, logoSize, logoSize)
      logoLoaded = true
    } catch (err) {
      console.error('Failed to load logo for PDF:', err)
    }
  }

  if (!logoLoaded) {
    doc.setFillColor(theme.primary[0], theme.primary[1], theme.primary[2])
    doc.circle(margin + logoSize / 2, yPos + logoSize / 2, logoSize / 2, 'F')
    const initials = getInitials(event.title)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(255, 255, 255)
    doc.text(initials, margin + logoSize / 2, yPos + logoSize / 2 + 2, { align: 'center' })
    logoLoaded = true
  }

  const textStartX = margin + logoSize + 10
  const textWidth = contentWidth - logoSize - 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(30, 41, 59)
  const eventTitleLines = doc.splitTextToSize(event.title, textWidth)
  doc.text(eventTitleLines, textStartX, yPos + 8)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text('International Hope School Bangladesh', textStartX, yPos + 8 + eventTitleLines.length * 8 + 3)

  yPos = Math.max(yPos + logoSize + 5, yPos + 8 + eventTitleLines.length * 8 + 12)

  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.5)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 10

  doc.setFillColor(theme.primary[0], theme.primary[1], theme.primary[2])
  doc.roundedRect(margin, yPos, 50, 8, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text('REGISTRATION DETAILS', margin + 25, yPos + 5.5, { align: 'center' })
  yPos += 15

  doc.setFillColor(theme.accentLight[0], theme.accentLight[1], theme.accentLight[2])
  doc.setDrawColor(theme.accent[0], theme.accent[1], theme.accent[2])
  doc.setLineWidth(1)
  doc.roundedRect(margin, yPos, contentWidth, 20, 3, 3, 'FD')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(theme.accent[0], theme.accent[1], theme.accent[2])
  doc.text('Registration ID', margin + 5, yPos + 6)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(theme.accentDark[0], theme.accentDark[1], theme.accentDark[2])
  doc.text(registration.registrationId || registration.id, margin + 5, yPos + 15)
  yPos += 28

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2])
  doc.text('PARTICIPANT INFORMATION', margin, yPos)
  yPos += 8

  const col1X = margin
  const col2X = pageWidth / 2 + 5
  const colWidth = contentWidth / 2 - 10

  const drawField = (label: string, value: string, x: number, y: number) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(label, x, y)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(30, 41, 59)
    const lines = doc.splitTextToSize(value || '—', colWidth)
    doc.text(lines[0], x, y + 6)
    return y + 16
  }

  let leftY = yPos
  let rightY = yPos

  leftY = drawField('Name', registration.name, col1X, leftY)
  leftY = drawField('Email', registration.email, col1X, leftY)
  leftY = drawField('Phone', registration.phone, col1X, leftY)
  rightY = drawField('School', registration.school, col2X, rightY)
  if (registration.category) {
    rightY = drawField('Category', registration.category, col2X, rightY)
  }

  yPos = Math.max(leftY, rightY) + 5

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2])
  doc.text('EVENT INFORMATION', margin, yPos)
  yPos += 8

  const eventDate = formatEventDates(parseEventDates(event.date), 'long') || 'TBA'
  const venue = event.venue || event.location || 'TBA'

  leftY = drawField('Date', eventDate, col1X, yPos)
  leftY = drawField('Time', event.time || 'TBA', col1X, leftY)
  rightY = drawField('Venue', venue, col2X, yPos)
  yPos = Math.max(leftY, rightY) + 5

  if (registration.position != null && registration.position >= 1 && registration.position <= 20) {
    const positionLabel =
      registration.position === 1 ? '1st' : registration.position === 2 ? '2nd' : registration.position === 3 ? '3rd' : `${registration.position}th`
    let badgeBg: number[], badgeBorder: number[], badgeText: number[]
    if (registration.position === 1) {
      badgeBg = [254, 240, 138]
      badgeBorder = [234, 179, 8]
      badgeText = [161, 98, 7]
    } else if (registration.position === 2) {
      badgeBg = [226, 232, 240]
      badgeBorder = [148, 163, 184]
      badgeText = [51, 65, 85]
    } else if (registration.position === 3) {
      badgeBg = [254, 215, 170]
      badgeBorder = [251, 146, 60]
      badgeText = [154, 52, 18]
    } else {
      badgeBg = theme.other4th
      badgeBorder = theme.other4thBorder
      badgeText = theme.other4thText
    }
    doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2])
    doc.setDrawColor(badgeBorder[0], badgeBorder[1], badgeBorder[2])
    doc.setLineWidth(1.5)
    doc.roundedRect(margin, yPos, 70, 14, 3, 3, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(badgeText[0], badgeText[1], badgeText[2])
    doc.text(`${positionLabel} Position`, margin + 35, yPos + 9.5, { align: 'center' })
    yPos += 22
  }

  yPos += 5

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || 'https://ihsb-events.vercel.app'
  const qrData = `${baseUrl}/verify/${registration.registrationId || registration.id}`

  const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
    width: 200,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#1e293b', light: '#ffffff' },
  })

  const qrSize = 40
  const qrX = pageWidth / 2 - qrSize / 2

  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.5)
  doc.roundedRect(qrX - 8, yPos - 5, qrSize + 16, qrSize + 22, 4, 4, 'FD')
  doc.addImage(qrCodeDataUrl, 'PNG', qrX, yPos, qrSize, qrSize)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('Scan to verify', pageWidth / 2, yPos + qrSize + 6, { align: 'center' })

  const footerY = pageHeight - 18
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.3)
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text('Official Registration Certificate | International Hope School Bangladesh', pageWidth / 2, footerY, { align: 'center' })
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, footerY + 5, { align: 'center' })

  doc.setFillColor(theme.primary[0], theme.primary[1], theme.primary[2])
  doc.rect(0, pageHeight - 6, pageWidth, 6, 'F')

  const arrayBuffer = doc.output('arraybuffer')
  return Buffer.from(arrayBuffer)
}

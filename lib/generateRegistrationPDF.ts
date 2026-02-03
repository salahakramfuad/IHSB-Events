import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import type { Event } from '@/types/event'
import type { Registration } from '@/types/registration'
import { formatEventDates, parseEventDates } from './dateUtils'

/** PDF color theme: primary bar/badges, accent for registration ID box, other4th for position 4-20 */
export const PDF_THEMES: Record<string, { primary: number[]; accent: number[]; accentDark: number[]; accentLight: number[]; other4th: number[]; other4thBorder: number[]; other4thText: number[] }> = {
  indigo: {
    primary: [79, 70, 229],
    accent: [59, 130, 246],
    accentDark: [30, 64, 175],
    accentLight: [239, 246, 255],
    other4th: [224, 231, 255],
    other4thBorder: [129, 140, 248],
    other4thText: [55, 48, 163],
  },
  purple: {
    primary: [124, 58, 237],
    accent: [139, 92, 246],
    accentDark: [91, 33, 182],
    accentLight: [245, 243, 255],
    other4th: [237, 233, 254],
    other4thBorder: [167, 139, 250],
    other4thText: [91, 33, 182],
  },
  blue: {
    primary: [37, 99, 235],
    accent: [59, 130, 246],
    accentDark: [30, 64, 175],
    accentLight: [239, 246, 255],
    other4th: [219, 234, 254],
    other4thBorder: [96, 165, 250],
    other4thText: [30, 64, 175],
  },
  emerald: {
    primary: [16, 185, 129],
    accent: [34, 197, 94],
    accentDark: [22, 101, 52],
    accentLight: [236, 253, 245],
    other4th: [209, 250, 229],
    other4thBorder: [52, 211, 153],
    other4thText: [6, 78, 59],
  },
  amber: {
    primary: [245, 158, 11],
    accent: [251, 191, 36],
    accentDark: [180, 83, 9],
    accentLight: [255, 251, 235],
    other4th: [254, 243, 199],
    other4thBorder: [251, 191, 36],
    other4thText: [146, 64, 14],
  },
  rose: {
    primary: [244, 63, 94],
    accent: [251, 113, 133],
    accentDark: [190, 18, 60],
    accentLight: [255, 241, 242],
    other4th: [255, 228, 230],
    other4thBorder: [251, 113, 133],
    other4thText: [159, 18, 57],
  },
}

const DEFAULT_THEME = PDF_THEMES.indigo

/** Parse hex to RGB [r, g, b] */
function hexToRgb(hex: string): number[] | null {
  const m = hex.replace(/^#/, '').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null
}

/** Lighten RGB by factor 0–1 (1 = white) */
function lighten(rgb: number[], factor: number): number[] {
  return rgb.map((c) => Math.round(c + (255 - c) * factor))
}

/** Darken RGB by factor 0–1 (1 = black) */
function darken(rgb: number[], factor: number): number[] {
  return rgb.map((c) => Math.round(c * (1 - factor)))
}

/** Build theme from a single hex color */
function themeFromHex(hex: string): typeof DEFAULT_THEME {
  const primary = hexToRgb(hex)
  if (!primary) return DEFAULT_THEME
  return {
    primary,
    accent: lighten(primary, 0.15),
    accentDark: darken(primary, 0.4),
    accentLight: lighten(primary, 0.92),
    other4th: lighten(primary, 0.88),
    other4thBorder: lighten(primary, 0.5),
    other4thText: darken(primary, 0.35),
  }
}

export function getTheme(event: Event) {
  const val = event.colorTheme?.trim()
  if (!val) return DEFAULT_THEME
  if (val.startsWith('#')) return themeFromHex(val)
  const key = val.toLowerCase()
  return (key && PDF_THEMES[key]) || DEFAULT_THEME
}

interface GenerateRegistrationPDFProps {
  event: Event
  registration: Registration
  logoUrl?: string
}

export async function generateRegistrationPDF({
  event,
  registration,
  logoUrl,
}: GenerateRegistrationPDFProps): Promise<void> {
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

  // Background
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  // Top decorative bar
  doc.setFillColor(theme.primary[0], theme.primary[1], theme.primary[2])
  doc.rect(0, 0, pageWidth, 6, 'F')

  let yPos = 18

  // Header section: Logo on left, Event name on right
  const logoSize = 25
  let logoLoaded = false
  
  // Helper to get initials from event title
  const getInitials = (title: string) => {
    return title
      .split(' ')
      .filter(word => word.length > 0)
      .slice(0, 2)
      .map(word => word[0].toUpperCase())
      .join('')
  }
  
  // Try to load event logo, otherwise draw initials
  if (logoUrl && logoUrl.trim() && (logoUrl.startsWith('http') || logoUrl.startsWith('/'))) {
    try {
      const logoData = await loadImageAsBase64(logoUrl)
      doc.addImage(logoData, 'PNG', margin, yPos, logoSize, logoSize)
      logoLoaded = true
    } catch (error) {
      console.error('Failed to load logo:', error)
    }
  }
  
  // If no logo loaded, draw initials
  if (!logoLoaded) {
    // Draw circular background
    doc.setFillColor(theme.primary[0], theme.primary[1], theme.primary[2])
    doc.circle(margin + logoSize / 2, yPos + logoSize / 2, logoSize / 2, 'F')
    
    // Draw initials
    const initials = getInitials(event.title)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(255, 255, 255)
    doc.text(initials, margin + logoSize / 2, yPos + logoSize / 2 + 2, { align: 'center' })
    
    logoLoaded = true // Mark as loaded so layout uses logo space
  }

  // Event name - to the right of logo
  const textStartX = logoLoaded ? margin + logoSize + 10 : margin
  const textWidth = logoLoaded ? contentWidth - logoSize - 10 : contentWidth
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(30, 41, 59) // Slate-800
  const eventTitleLines = doc.splitTextToSize(event.title, textWidth)
  doc.text(eventTitleLines, textStartX, yPos + 8)
  
  // Organization subtitle
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139) // Slate-500
  doc.text('International Hope School Bangladesh', textStartX, yPos + 8 + (eventTitleLines.length * 8) + 3)

  yPos = Math.max(yPos + logoSize + 5, yPos + 8 + (eventTitleLines.length * 8) + 12)

  // Divider line
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.5)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 10

  // Registration Details Badge
  doc.setFillColor(theme.primary[0], theme.primary[1], theme.primary[2])
  doc.roundedRect(margin, yPos, 50, 8, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text('REGISTRATION DETAILS', margin + 25, yPos + 5.5, { align: 'center' })
  yPos += 15

  // Registration ID - Large highlighted box
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

  // Participant Information Section
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2])
  doc.text('PARTICIPANT INFORMATION', margin, yPos)
  yPos += 8

  // Info grid - two columns
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

  // Left column
  leftY = drawField('Name', registration.name, col1X, leftY)
  leftY = drawField('Email', registration.email, col1X, leftY)
  leftY = drawField('Phone', registration.phone, col1X, leftY)

  // Right column
  rightY = drawField('School', registration.school, col2X, rightY)
  if (registration.category) {
    rightY = drawField('Category', registration.category, col2X, rightY)
  }

  yPos = Math.max(leftY, rightY) + 5

  // Event Information Section
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2])
  doc.text('EVENT INFORMATION', margin, yPos)
  yPos += 8

  const eventDate = formatEventDates(parseEventDates(event.date), 'long') || 'TBA'
  const venue = event.venue || event.location || 'TBA'

  leftY = yPos
  rightY = yPos

  // Left column - event details
  leftY = drawField('Date', eventDate, col1X, leftY)
  leftY = drawField('Time', event.time || 'TBA', col1X, leftY)

  // Right column
  rightY = drawField('Venue', venue, col2X, rightY)

  yPos = Math.max(leftY, rightY) + 5

  // Position badge if winner
  if (registration.position != null && registration.position >= 1 && registration.position <= 20) {
    const positionLabel = registration.position === 1 ? '1st' : registration.position === 2 ? '2nd' : registration.position === 3 ? '3rd' : `${registration.position}th`
    
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

  // QR Code Section - centered at bottom
  yPos += 5
  
  // Generate QR code with verification URL - always use the production URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || 'https://ihsb-events.vercel.app'
  const qrData = `${baseUrl}/verify/${registration.registrationId || registration.id}`
  
  const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
    width: 200,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#1e293b',
      light: '#ffffff',
    },
  })

  const qrSize = 40
  const qrX = pageWidth / 2 - qrSize / 2
  
  // QR code container box
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.5)
  doc.roundedRect(qrX - 8, yPos - 5, qrSize + 16, qrSize + 22, 4, 4, 'FD')
  
  // Add QR code image
  doc.addImage(qrCodeDataUrl, 'PNG', qrX, yPos, qrSize, qrSize)
  
  // QR label
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('Scan to verify', pageWidth / 2, yPos + qrSize + 6, { align: 'center' })

  // Footer
  const footerY = pageHeight - 18
  
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.3)
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text('Official Registration Certificate | International Hope School Bangladesh', pageWidth / 2, footerY, { align: 'center' })
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, footerY + 5, { align: 'center' })

  // Bottom decorative bar
  doc.setFillColor(theme.primary[0], theme.primary[1], theme.primary[2])
  doc.rect(0, pageHeight - 6, pageWidth, 6, 'F')

  // Save the PDF
  const fileName = `${registration.name.replace(/[^a-z0-9]/gi, '_')}_${event.title.replace(/[^a-z0-9]/gi, '_')}_Registration.pdf`
  doc.save(fileName)
}

/**
 * Generate a combined PDF with all registrations
 */
export async function generateAllRegistrationsPDF({
  event,
  registrations,
  logoUrl,
}: {
  event: Event
  registrations: Registration[]
  logoUrl?: string
}): Promise<void> {
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

  // Load logo once
  let logoData: string | null = null
  if (logoUrl && logoUrl.trim() && (logoUrl.startsWith('http') || logoUrl.startsWith('/'))) {
    try {
      logoData = await loadImageAsBase64(logoUrl)
    } catch (error) {
      console.error('Failed to load logo:', error)
    }
  }
  
  // Helper to get initials from event title
  const getInitials = (title: string) => {
    return title
      .split(' ')
      .filter(word => word.length > 0)
      .slice(0, 2)
      .map(word => word[0].toUpperCase())
      .join('')
  }

  // Generate QR codes for all registrations first
  const qrCodes: Map<string, string> = new Map()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || 'https://ihsb-events.vercel.app'
  
  for (const reg of registrations) {
    const qrData = `${baseUrl}/verify/${reg.registrationId || reg.id}`
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#1e293b',
          light: '#ffffff',
        },
      })
      qrCodes.set(reg.id, qrCodeDataUrl)
    } catch (error) {
      console.error('Failed to generate QR code for', reg.id)
    }
  }

  // Event info
  const eventDate = formatEventDates(parseEventDates(event.date), 'long') || 'TBA'
  const venue = event.venue || event.location || 'TBA'

  // Generate a page for each registration
  for (let i = 0; i < registrations.length; i++) {
    const registration = registrations[i]
    
    if (i > 0) {
      doc.addPage()
    }

    // Background
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')

    // Top decorative bar
    doc.setFillColor(theme.primary[0], theme.primary[1], theme.primary[2])
    doc.rect(0, 0, pageWidth, 6, 'F')

    let yPos = 18

    // Header section: Logo on left, Event name on right
    const logoSize = 25
    let logoLoaded = false
    
    if (logoData) {
      try {
        doc.addImage(logoData, 'PNG', margin, yPos, logoSize, logoSize)
        logoLoaded = true
      } catch (error) {
        console.error('Failed to add logo to page')
      }
    }
    
    // If no logo loaded, draw initials
    if (!logoLoaded) {
      // Draw circular background
      doc.setFillColor(theme.primary[0], theme.primary[1], theme.primary[2])
      doc.circle(margin + logoSize / 2, yPos + logoSize / 2, logoSize / 2, 'F')
      
      // Draw initials
      const initials = getInitials(event.title)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(255, 255, 255)
      doc.text(initials, margin + logoSize / 2, yPos + logoSize / 2 + 2, { align: 'center' })
      
      logoLoaded = true
    }

    // Event name
    const textStartX = logoLoaded ? margin + logoSize + 10 : margin
    const textWidth = logoLoaded ? contentWidth - logoSize - 10 : contentWidth
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(30, 41, 59)
    const eventTitleLines = doc.splitTextToSize(event.title, textWidth)
    doc.text(eventTitleLines, textStartX, yPos + 8)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text('International Hope School Bangladesh', textStartX, yPos + 8 + (eventTitleLines.length * 8) + 3)

    yPos = Math.max(yPos + logoSize + 5, yPos + 8 + (eventTitleLines.length * 8) + 12)

    // Divider line
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.5)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 10

    // Registration Details Badge
    doc.setFillColor(theme.primary[0], theme.primary[1], theme.primary[2])
    doc.roundedRect(margin, yPos, 50, 8, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    doc.text('REGISTRATION DETAILS', margin + 25, yPos + 5.5, { align: 'center' })
    
    yPos += 15

    // Registration ID box
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

    // Participant Information
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

    // Event Information
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2])
    doc.text('EVENT INFORMATION', margin, yPos)
    yPos += 8

    leftY = yPos
    rightY = yPos

    leftY = drawField('Date', eventDate, col1X, leftY)
    leftY = drawField('Time', event.time || 'TBA', col1X, leftY)
    rightY = drawField('Venue', venue, col2X, rightY)

    yPos = Math.max(leftY, rightY) + 5

    // Position badge
    if (registration.position != null && registration.position >= 1 && registration.position <= 20) {
      const positionLabel = registration.position === 1 ? '1st' : registration.position === 2 ? '2nd' : registration.position === 3 ? '3rd' : `${registration.position}th`
      
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

    // QR Code
    yPos += 5
    const qrCodeDataUrl = qrCodes.get(registration.id)
    
    if (qrCodeDataUrl) {
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
    }

    // Footer
    const footerY = pageHeight - 18
    
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(148, 163, 184)
    doc.text('Official Registration Certificate | International Hope School Bangladesh', pageWidth / 2, footerY, { align: 'center' })
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, footerY + 5, { align: 'center' })

  // Bottom bar
  doc.setFillColor(theme.primary[0], theme.primary[1], theme.primary[2])
  doc.rect(0, pageHeight - 6, pageWidth, 6, 'F')
  }

  // Save the combined PDF
  const fileName = `${event.title.replace(/[^a-z0-9]/gi, '_')}_All_Registrations.pdf`
  doc.save(fileName)
}

// Helper function to load image as base64
async function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      ctx.drawImage(img, 0, 0)
      const dataURL = canvas.toDataURL('image/png')
      resolve(dataURL)
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    
    img.src = url
  })
}

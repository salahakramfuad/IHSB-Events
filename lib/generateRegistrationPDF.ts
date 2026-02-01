import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import type { Event } from '@/types/event'
import type { Registration } from '@/types/registration'
import { formatEventDates, parseEventDates } from './dateUtils'

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

  // Background
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  // Top decorative bar
  doc.setFillColor(79, 70, 229) // Indigo
  doc.rect(0, 0, pageWidth, 6, 'F')

  let yPos = 18

  // Header section: Logo on left, Event name on right
  const logoSize = 25
  let logoLoaded = false
  
  if (logoUrl && (logoUrl.startsWith('http') || logoUrl.startsWith('/'))) {
    try {
      const logoData = await loadImageAsBase64(logoUrl)
      doc.addImage(logoData, 'PNG', margin, yPos, logoSize, logoSize)
      logoLoaded = true
    } catch (error) {
      console.error('Failed to load logo:', error)
    }
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
  doc.setFillColor(79, 70, 229) // Indigo
  doc.roundedRect(margin, yPos, 50, 8, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text('REGISTRATION DETAILS', margin + 25, yPos + 5.5, { align: 'center' })
  yPos += 15

  // Registration ID - Large highlighted box
  doc.setFillColor(239, 246, 255) // Blue-50
  doc.setDrawColor(59, 130, 246) // Blue-500
  doc.setLineWidth(1)
  doc.roundedRect(margin, yPos, contentWidth, 20, 3, 3, 'FD')
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(59, 130, 246) // Blue-500
  doc.text('Registration ID', margin + 5, yPos + 6)
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(30, 64, 175) // Blue-800
  doc.text(registration.registrationId || registration.id, margin + 5, yPos + 15)
  
  yPos += 28

  // Participant Information Section
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(79, 70, 229) // Indigo
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
  doc.setTextColor(79, 70, 229) // Indigo
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
      badgeBg = [224, 231, 255]
      badgeBorder = [129, 140, 248]
      badgeText = [55, 48, 163]
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
  doc.setFillColor(79, 70, 229)
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

  // Load logo once
  let logoData: string | null = null
  if (logoUrl && (logoUrl.startsWith('http') || logoUrl.startsWith('/'))) {
    try {
      logoData = await loadImageAsBase64(logoUrl)
    } catch (error) {
      console.error('Failed to load logo:', error)
    }
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
    doc.setFillColor(79, 70, 229)
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
    doc.setFillColor(79, 70, 229)
    doc.roundedRect(margin, yPos, 50, 8, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    doc.text('REGISTRATION DETAILS', margin + 25, yPos + 5.5, { align: 'center' })
    
    // Page indicator
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(148, 163, 184)
    doc.text(`${i + 1} of ${registrations.length}`, pageWidth - margin, yPos + 5.5, { align: 'right' })
    
    yPos += 15

    // Registration ID box
    doc.setFillColor(239, 246, 255)
    doc.setDrawColor(59, 130, 246)
    doc.setLineWidth(1)
    doc.roundedRect(margin, yPos, contentWidth, 20, 3, 3, 'FD')
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(59, 130, 246)
    doc.text('Registration ID', margin + 5, yPos + 6)
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(30, 64, 175)
    doc.text(registration.registrationId || registration.id, margin + 5, yPos + 15)
    
    yPos += 28

    // Participant Information
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(79, 70, 229)
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
    doc.setTextColor(79, 70, 229)
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
        badgeBg = [224, 231, 255]
        badgeBorder = [129, 140, 248]
        badgeText = [55, 48, 163]
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
    doc.setFillColor(79, 70, 229)
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

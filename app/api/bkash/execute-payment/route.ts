import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { executePayment } from '@/lib/bkash'
import { sendIHSBConfirmationEmail } from '@/lib/brevo'
import { generateRegistrationId } from '@/lib/registrationId'
import { ensureSchoolExists } from '@/lib/schools'
import { generateRegistrationPDFAsBuffer } from '@/lib/generateRegistrationPDFServer'
import type { Event } from '@/types/event'
import type { Registration } from '@/types/registration'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentID, registrationData } = body

    if (!paymentID || typeof paymentID !== 'string') {
      return NextResponse.json(
        { error: 'Missing paymentID' },
        { status: 400 }
      )
    }

    if (!registrationData || typeof registrationData !== 'object') {
      return NextResponse.json(
        { error: 'Missing registrationData' },
        { status: 400 }
      )
    }

    const { name, email, phone, school, note, category } = registrationData
    if (!name?.trim() || !email?.trim() || !phone?.trim() || !school?.trim()) {
      return NextResponse.json(
        { error: 'Missing required registration fields' },
        { status: 400 }
      )
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    let userId: string | undefined
    try {
      const token = request.cookies.get('auth-token')?.value
      if (token && adminAuth) {
        const decoded = await adminAuth.verifyIdToken(token)
        if (decoded?.uid) userId = decoded.uid
      }
    } catch {
      // Proceed without userId if token missing/expired (e.g. callback after long delay)
    }

    const result = await executePayment(paymentID)

    if (!result.success) {
      const errMsg = result.errorMessage ?? 'Payment execution failed'
      console.error('Execute payment failed:', { paymentID, error: errMsg, errorCode: result.errorCode })
      return NextResponse.json(
        {
          success: false,
          error: errMsg,
          errorCode: result.errorCode,
        },
        { status: 400 }
      )
    }

    const merchantInvoiceNumber = result.merchantInvoiceNumber
    if (!merchantInvoiceNumber?.startsWith('IHSB-')) {
      return NextResponse.json(
        { error: 'Invalid invoice number' },
        { status: 400 }
      )
    }

    const parts = merchantInvoiceNumber.split('-')
    if (parts.length < 3) {
      return NextResponse.json(
        { error: 'Invalid invoice format' },
        { status: 400 }
      )
    }
    const eventId = parts[1]
    if (!eventId) {
      return NextResponse.json(
        { error: 'Invalid invoice format' },
        { status: 400 }
      )
    }

    const normalizedEmail = normalizeEmail(email)
    const regsRef = adminDb
      .collection('events')
      .doc(eventId)
      .collection('registrations')

    const existingSnap = await regsRef.where('email', '==', normalizedEmail).limit(1).get()
    if (!existingSnap.empty) {
      const existingData = existingSnap.docs[0].data()
      if (!existingData.deletedAt) {
        return NextResponse.json({
          success: true,
          registrationId: existingData.registrationId,
          eventId,
          trxID: result.trxID,
        })
      }
    }

    await ensureSchoolExists(school.trim())

    const registrationId = generateRegistrationId()
    const regRef = regsRef.doc(registrationId)
    const now = new Date()

    const regPayload: Record<string, unknown> = {
      registrationId,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      school: school.trim(),
      note: note != null ? String(note).trim() : '',
      category: category != null && String(category).trim() ? String(category).trim() : undefined,
      createdAt: now,
      paymentStatus: 'completed',
      bkashTrxId: result.trxID ?? null,
    }
    if (userId) regPayload.userId = userId

    await regRef.set(regPayload)

    const eventDoc = await adminDb.collection('events').doc(eventId).get()
    if (!eventDoc.exists) {
      return NextResponse.json({
        success: true,
        registrationId,
        eventId,
        trxID: result.trxID,
      })
    }

    const eventDataRaw = eventDoc.data()!
    let dateValue = eventDataRaw.date
    if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue) {
      dateValue = (dateValue as { toDate: () => Date }).toDate().toISOString().split('T')[0]
    } else if (dateValue && typeof dateValue === 'object' && '_seconds' in dateValue) {
      dateValue = new Date((dateValue as { _seconds: number })._seconds * 1000).toISOString().split('T')[0]
    }

    const eventForEmail: Event = {
      id: eventDoc.id,
      ...eventDataRaw,
      date: dateValue as string,
      createdAt: eventDataRaw.createdAt?.toDate?.() ?? eventDataRaw.createdAt,
      updatedAt: eventDataRaw.updatedAt?.toDate?.() ?? eventDataRaw.updatedAt,
      createdBy: eventDataRaw.createdBy ?? '',
      title: eventDataRaw.title ?? 'Event',
      location: eventDataRaw.location ?? '',
      description: eventDataRaw.description ?? '',
    }

    const registrationForPdf: Registration = {
      id: registrationId,
      registrationId,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      school: school.trim(),
      note: note != null ? String(note).trim() : undefined,
      category: category != null && String(category).trim() ? String(category).trim() : undefined,
      position: null,
      paymentStatus: 'completed',
      createdAt: now.toISOString(),
    }

    const sendPdf = eventDataRaw.sendPdfOnRegistration !== false
    let pdfAttachment: { content: string; name: string } | undefined
    if (sendPdf) {
      try {
        const pdfBuffer = await generateRegistrationPDFAsBuffer({
          event: eventForEmail,
          registration: registrationForPdf,
          logoUrl: eventDataRaw.logo,
        })
        const safeName = name.trim().replace(/[^a-z0-9]/gi, '_')
        const safeTitle = eventDataRaw.title?.replace(/[^a-z0-9]/gi, '_') ?? 'Event'
        pdfAttachment = {
          content: pdfBuffer.toString('base64'),
          name: `${safeName}_${safeTitle}_Registration.pdf`,
        }
      } catch (pdfErr) {
        console.error('Failed to generate registration PDF for email:', pdfErr)
      }
    }

    await sendIHSBConfirmationEmail({
      to: normalizedEmail,
      name: name.trim(),
      event: eventForEmail,
      registrationId,
      pdfAttachment,
    })

    revalidateTag('schools', 'max')
    revalidateTag('admin-dashboard', 'max')
    return NextResponse.json({
      success: true,
      registrationId,
      eventId,
      trxID: result.trxID,
    })
  } catch (error) {
    console.error('bKash execute payment error:', error)
    const message = error instanceof Error ? error.message : 'Payment execution failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { generateRegistrationId } from '@/lib/registrationId'
import { sendIHSBConfirmationEmail } from '@/lib/brevo'
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
    const { eventId, name, email, phone, school, note, category } = body

    if (!eventId || !name?.trim() || !email?.trim() || !phone?.trim() || !school?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, name, email, phone, school' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const normalizedEmail = normalizeEmail(email)

    let userId: string | undefined
    try {
      const token = request.cookies.get('auth-token')?.value
      if (token && adminAuth) {
        const decoded = await adminAuth.verifyIdToken(token)
        if (decoded?.uid) {
          userId = decoded.uid
        }
      }
    } catch {
      // Token invalid or expired
    }

    // Require an account to register for events
    if (!userId) {
      return NextResponse.json(
        { error: 'You must sign in to register for events. Please create an account or sign in and try again.' },
        { status: 401 }
      )
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const eventRef = adminDb.collection('events').doc(eventId)
    const eventSnap = await eventRef.get()
    if (!eventSnap.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const eventDataRaw = eventSnap.data()!
    const eventCategories = Array.isArray(eventDataRaw.categories)
      ? eventDataRaw.categories.filter((c: unknown) => typeof c === 'string' && c.trim())
      : []
    if (eventCategories.length > 0) {
      const chosen = category != null ? String(category).trim() : ''
      if (!chosen || !eventCategories.includes(chosen)) {
        return NextResponse.json(
          { error: 'Please select a valid category.' },
          { status: 400 }
        )
      }
    }

    const regsRef = eventRef.collection('registrations')

    const isPaidEvent = !!eventDataRaw.isPaid && typeof eventDataRaw.amount === 'number' && eventDataRaw.amount > 0
    if (isPaidEvent) {
      return NextResponse.json(
        { error: 'This is a paid event. Please use the payment flow.' },
        { status: 400 }
      )
    }

    const duplicateSnap = await regsRef.where('email', '==', normalizedEmail).limit(1).get()
    if (!duplicateSnap.empty) {
      const existing = duplicateSnap.docs[0].data()
      if (!existing.deletedAt) {
        return NextResponse.json(
          { error: 'You have already registered for this event with this email address.' },
          { status: 409 }
        )
      }
    }

    await ensureSchoolExists(school.trim())

    const registrationId = generateRegistrationId()
    const now = new Date()
    const regData: Record<string, unknown> = {
      registrationId,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      school: school.trim(),
      note: note != null ? String(note).trim() : '',
      createdAt: now,
    }
    if (userId) {
      regData.userId = userId
    }
    if (eventCategories.length > 0 && category != null && String(category).trim()) {
      regData.category = String(category).trim()
    }

    const newRegRef = regsRef.doc(registrationId)
    await newRegRef.set(regData)

    const eventData = eventSnap.data()!
    let dateValue = eventData.date
    if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue) {
      dateValue = (dateValue as { toDate: () => Date }).toDate().toISOString().split('T')[0]
    } else if (dateValue && typeof dateValue === 'object' && '_seconds' in dateValue) {
      dateValue = new Date((dateValue as { _seconds: number })._seconds * 1000).toISOString().split('T')[0]
    }
    const eventForEmail: Event = {
      id: eventSnap.id,
      ...eventData,
      date: dateValue as string,
      createdAt: eventData.createdAt?.toDate?.() ?? eventData.createdAt,
      updatedAt: eventData.updatedAt?.toDate?.() ?? eventData.updatedAt,
      createdBy: eventData.createdBy ?? '',
      title: eventData.title ?? 'Event',
      location: eventData.location ?? '',
      description: eventData.description ?? '',
    }

    const registrationForPdf: Registration = {
      id: registrationId,
      registrationId,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      school: school.trim(),
      note: note != null ? String(note).trim() : undefined,
      category: eventCategories.length > 0 && category != null ? String(category).trim() : undefined,
      position: null,
      createdAt: now.toISOString(),
    }

    const sendPdf = eventData.sendPdfOnRegistration !== false
    let pdfAttachment: { content: string; name: string } | undefined
    if (sendPdf) {
      try {
        const pdfBuffer = await generateRegistrationPDFAsBuffer({
          event: eventForEmail,
          registration: registrationForPdf,
          logoUrl: eventData.logo,
        })
        const safeName = name.trim().replace(/[^a-z0-9]/gi, '_')
        const safeTitle = eventData.title?.replace(/[^a-z0-9]/gi, '_') ?? 'Event'
        pdfAttachment = {
          content: pdfBuffer.toString('base64'),
          name: `${safeName}_${safeTitle}_Registration.pdf`,
        }
      } catch (pdfErr) {
        console.error('Failed to generate registration PDF for email:', pdfErr)
      }
    }

    const emailResult = await sendIHSBConfirmationEmail({
      to: normalizedEmail,
      name: name.trim(),
      event: eventForEmail,
      registrationId,
      pdfAttachment,
    })

    if (!emailResult.success) {
      await newRegRef.delete()
      return NextResponse.json(
        { error: emailResult.error ?? 'Failed to send confirmation email.' },
        { status: 500 }
      )
    }

    revalidateTag('schools', 'max')
    revalidateTag('admin-dashboard', 'max')
    return NextResponse.json({ success: true, registrationId }, { status: 201 })
  } catch (error) {
    console.error('Register API error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}

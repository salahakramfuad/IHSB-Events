import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { generateRegistrationId } from '@/lib/registrationId'
import { sendIHSBConfirmationEmail } from '@/lib/brevo'
import type { Event } from '@/types/event'

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
      return NextResponse.json(
        { error: 'You have already registered for this event with this email address.' },
        { status: 409 }
      )
    }

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

    const emailResult = await sendIHSBConfirmationEmail({
      to: normalizedEmail,
      name: name.trim(),
      event: eventForEmail,
      registrationId,
    })

    if (!emailResult.success) {
      await newRegRef.delete()
      return NextResponse.json(
        { error: emailResult.error ?? 'Failed to send confirmation email.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, registrationId }, { status: 201 })
  } catch (error) {
    console.error('Register API error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}

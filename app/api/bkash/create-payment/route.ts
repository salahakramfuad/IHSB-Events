import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { createPayment } from '@/lib/bkash'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, clientGeneratedId, registrationData } = body

    if (!eventId || !clientGeneratedId || !registrationData) {
      return NextResponse.json(
        { error: 'Missing eventId, clientGeneratedId or registrationData' },
        { status: 400 }
      )
    }

    const { name, email, phone, school, note, category } = registrationData
    if (!name?.trim() || !email?.trim() || !phone?.trim() || !school?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phone, school' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const eventRef = adminDb.collection('events').doc(eventId)
    const eventSnap = await eventRef.get()
    if (!eventSnap.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const eventData = eventSnap.data()!
    if (!eventData.isPaid) {
      return NextResponse.json({ error: 'Event is not a paid event' }, { status: 400 })
    }

    const eventCategories = Array.isArray(eventData.categories)
      ? eventData.categories.filter((c: unknown) => typeof c === 'string' && (c as string).trim())
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

    const categoryAmounts = eventData.categoryAmounts && typeof eventData.categoryAmounts === 'object'
      ? eventData.categoryAmounts as Record<string, number>
      : null
    const baseAmount = typeof eventData.amount === 'number' ? eventData.amount : 0
    let amount: number
    if (eventCategories.length > 0 && category && categoryAmounts && categoryAmounts[category] !== undefined) {
      amount = Number(categoryAmounts[category]) ?? 0
    } else {
      amount = baseAmount
    }
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'This category is free. Please complete registration without payment.' },
        { status: 400 }
      )
    }

    const normalizedEmail = normalizeEmail(email)
    const regsRef = eventRef.collection('registrations')
    const duplicateSnap = await regsRef.where('email', '==', normalizedEmail).limit(1).get()
    if (!duplicateSnap.empty) {
      return NextResponse.json(
        { error: 'You have already registered for this event with this email address.' },
        { status: 409 }
      )
    }

    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim() || 'http://localhost:3000'
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`
    }
    const callbackURL = `${baseUrl.replace(/\/$/, '')}/bkash/callback`

    const merchantInvoiceNumber = `IHSB-${eventId}-${clientGeneratedId}`

    const amountStr = Number.isInteger(amount) ? String(amount) : amount.toFixed(2)

    const result = await createPayment({
      amount: amountStr,
      currency: 'BDT',
      merchantInvoiceNumber,
      callbackURL,
      payerReference: phone?.replace(/\D/g, '').slice(-11) || undefined,
    })

    return NextResponse.json({
      success: true,
      bkashURL: result.bkashURL,
      paymentID: result.paymentID,
    })
  } catch (error) {
    console.error('bKash create payment error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create payment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

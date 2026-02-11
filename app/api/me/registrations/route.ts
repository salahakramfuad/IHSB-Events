import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { getCurrentUser } from '@/lib/get-current-user'
import type { Event } from '@/types/event'

type MyRegistration = {
  eventId: string
  eventTitle: string
  eventDate: string | null
  registrationId: string
  category?: string | null
  position: number | null
  createdAt: string
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const user = await getCurrentUser(token)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!adminDb) {
    return NextResponse.json({ registrations: [] }, { status: 200 })
  }

  try {
    const regsSnap = await adminDb
      .collectionGroup('registrations')
      .where('userId', '==', user.uid)
      .get()

    const items: MyRegistration[] = []

    for (const doc of regsSnap.docs) {
      const data = doc.data() as Record<string, unknown>
      if (data.deletedAt) continue

      const eventRef = doc.ref.parent.parent
      if (!eventRef) continue

      const eventSnap = await eventRef.get()
      if (!eventSnap.exists) continue
      const eventDataRaw = eventSnap.data() as Record<string, unknown>
      if (eventDataRaw.deletedAt) continue

      let dateValue = eventDataRaw.date
      if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue) {
        dateValue = (dateValue as { toDate: () => Date }).toDate().toISOString().split('T')[0]
      } else if (dateValue && typeof dateValue === 'object' && '_seconds' in dateValue) {
        dateValue = new Date((dateValue as { _seconds: number })._seconds * 1000).toISOString().split('T')[0]
      }

      const createdAtRaw = data.createdAt
      let createdAt: string
      if (createdAtRaw instanceof Date) {
        createdAt = createdAtRaw.toISOString()
      } else if (typeof createdAtRaw === 'string') {
        createdAt = createdAtRaw
      } else {
        createdAt = new Date().toISOString()
      }

      const eventCreatedAt = eventDataRaw.createdAt as { toDate?: () => Date } | undefined
      const eventUpdatedAt = eventDataRaw.updatedAt as { toDate?: () => Date } | undefined
      const event: Event = {
        id: eventSnap.id,
        ...eventDataRaw,
        date: dateValue as string,
        createdAt: eventCreatedAt?.toDate?.() ?? eventDataRaw.createdAt,
        updatedAt: eventUpdatedAt?.toDate?.() ?? eventDataRaw.updatedAt,
        createdBy: (eventDataRaw.createdBy as string) ?? '',
        title: (eventDataRaw.title as string) ?? 'Event',
        location: (eventDataRaw.location as string) ?? '',
        description: (eventDataRaw.description as string) ?? '',
      } as Event

      items.push({
        eventId: event.id,
        eventTitle: event.title,
        eventDate: typeof event.date === 'string' ? event.date : null,
        registrationId: (data.registrationId as string) || doc.id,
        category: (data.category as string) ?? null,
        position: (data.position as number | null) ?? null,
        createdAt,
      })
    }

    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    return NextResponse.json({ registrations: items }, { status: 200 })
  } catch (error) {
    console.error('Error fetching my registrations:', error)
    return NextResponse.json({ error: 'Failed to load registrations' }, { status: 500 })
  }
}


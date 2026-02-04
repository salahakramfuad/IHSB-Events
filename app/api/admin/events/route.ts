import type { DocumentSnapshot } from 'firebase-admin/firestore'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { getCurrentAdminProfile } from '@/lib/get-admin'
import type { Event } from '@/types/event'

function toEvent(doc: DocumentSnapshot): Event {
  const data = doc.data()!
  let dateValue = data.date
  if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue) {
    dateValue = (dateValue as { toDate: () => Date }).toDate().toISOString().split('T')[0]
  } else if (dateValue && typeof dateValue === 'object' && '_seconds' in dateValue) {
    dateValue = new Date((dateValue as { _seconds: number })._seconds * 1000).toISOString().split('T')[0]
  }
  const createdAt = data.createdAt?.toDate?.() ?? data.createdAt
  const updatedAt = data.updatedAt?.toDate?.() ?? data.updatedAt
  return {
    id: doc.id,
    ...data,
    date: dateValue,
    createdAt: createdAt instanceof Date ? createdAt.toISOString() : (createdAt as string) ?? '',
    updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : (updatedAt as string) ?? '',
    createdBy: data.createdBy ?? '',
    title: data.title ?? '',
    location: data.location ?? '',
    description: data.description ?? '',
  } as Event
}

export async function GET() {
  if (!adminDb) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const profile = await getCurrentAdminProfile(token)
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const snapshot = await adminDb.collection('events').get()
    const events: Event[] = []
    snapshot.forEach((doc) => {
      if (doc.data().deletedAt) return
      events.push(toEvent(doc))
    })
    events.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime()
      const tb = new Date(b.createdAt).getTime()
      return tb - ta
    })
    return NextResponse.json(events, {
      headers: { 'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120' },
    })
  } catch (error) {
    console.error('GET /api/admin/events error:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

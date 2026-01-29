'use server'

import { cache } from 'react'
import type { DocumentSnapshot } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { Event } from '@/types/event'

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

export const getPublicEvents = cache(async (): Promise<Event[]> => {
  if (!adminDb) return []
  try {
    const snapshot = await adminDb.collection('events').get()
    const events: Event[] = []
    snapshot.forEach((doc) => events.push(toEvent(doc)))
    events.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime()
      const tb = new Date(b.createdAt).getTime()
      return tb - ta
    })
    return events
  } catch (error) {
    console.error('Error fetching events:', error)
    return []
  }
})

export const getPublicEvent = cache(async (id: string): Promise<Event | null> => {
  if (!adminDb) return null
  try {
    const doc = await adminDb.collection('events').doc(id).get()
    if (!doc.exists) return null
    return toEvent(doc)
  } catch (error) {
    console.error('Error fetching event:', error)
    return null
  }
})

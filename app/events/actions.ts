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
  let resultsPublishedAtRaw = data.resultsPublishedAt?.toDate?.() ?? data.resultsPublishedAt
  if (resultsPublishedAtRaw && typeof resultsPublishedAtRaw === 'object' && '_seconds' in resultsPublishedAtRaw) {
    resultsPublishedAtRaw = new Date((resultsPublishedAtRaw as { _seconds: number })._seconds * 1000)
  }
  const resultsPublishedAt =
    resultsPublishedAtRaw instanceof Date
      ? resultsPublishedAtRaw.toISOString()
      : typeof resultsPublishedAtRaw === 'string'
        ? resultsPublishedAtRaw
        : null
  return {
    id: doc.id,
    ...data,
    date: dateValue,
    createdAt: createdAt instanceof Date ? createdAt.toISOString() : (createdAt as string) ?? '',
    updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : (updatedAt as string) ?? '',
    resultsPublishedAt,
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

/** Featured applicant for public display (position 1–20 only) */
export type FeaturedApplicant = { position: number; name: string; school?: string }

export const getPublicEventFeaturedRegistrations = cache(
  async (eventId: string): Promise<FeaturedApplicant[]> => {
    if (!adminDb) return []
    try {
      const snapshot = await adminDb
        .collection('events')
        .doc(eventId)
        .collection('registrations')
        .get()
      const list: FeaturedApplicant[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        const pos = data.position
        if (typeof pos === 'number' && pos >= 1 && pos <= 20) {
          list.push({
            position: pos,
            name: data.name ?? '',
            school: data.school ?? undefined,
          })
        }
      })
      list.sort((a, b) => a.position - b.position)
      return list
    } catch (error) {
      console.error('Error fetching featured registrations:', error)
      return []
    }
  }
)

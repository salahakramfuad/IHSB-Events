'use server'

import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import type { DocumentSnapshot } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { Event } from '@/types/event'
import type { FeaturedApplicant } from '@/types/registration'

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

async function fetchPublicEvents(): Promise<Event[]> {
  if (!adminDb) return []
  try {
    const snapshot = await adminDb
      .collection('events')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get()
    const events: Event[] = []
    snapshot.forEach((doc) => {
      if (doc.data().deletedAt) return
      events.push(toEvent(doc))
    })
    return events
  } catch (error) {
    console.error('Error fetching events:', error)
    return []
  }
}

export const getPublicEvents = cache(
  unstable_cache(fetchPublicEvents, ['public-events'], {
    revalidate: 60,
    tags: ['events'],
  })
)

async function fetchPublicEvent(id: string): Promise<Event | null> {
  if (!adminDb) return null
  try {
    const doc = await adminDb.collection('events').doc(id).get()
    if (!doc.exists) return null
    if (doc.data()?.deletedAt) return null
    return toEvent(doc)
  } catch (error) {
    console.error('Error fetching event:', error)
    return null
  }
}

export const getPublicEvent = cache(async (id: string): Promise<Event | null> => {
  return unstable_cache(
    () => fetchPublicEvent(id),
    ['public-event', id],
    { revalidate: 60, tags: ['events', `event-${id}`] }
  )()
})

async function fetchPublicEventFeaturedRegistrations(
  eventId: string
): Promise<FeaturedApplicant[]> {
  if (!adminDb) return []
  try {
    const snapshot = await adminDb
      .collection('events')
      .doc(eventId)
      .collection('registrations')
      .where('position', '>=', 1)
      .where('position', '<=', 20)
      .limit(50)
      .get()
    const list: FeaturedApplicant[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      if (data.deletedAt) return
      const pos = data.position
      const hasResultNotified = data.resultNotifiedAt != null
      if (hasResultNotified) {
        const regId = data.registrationId ?? doc.id
        list.push({
          position: pos,
          name: (data.name ?? data.fullName ?? data.studentName ?? regId ?? '').trim() || 'Awardee',
          school: data.school ?? undefined,
          registrationId: regId,
          category: data.category ?? undefined,
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

export const getPublicEventFeaturedRegistrations = cache(
  async (eventId: string): Promise<FeaturedApplicant[]> => {
    return unstable_cache(
      () => fetchPublicEventFeaturedRegistrations(eventId),
      ['featured-regs', eventId],
      { revalidate: 60, tags: ['events', `event-${eventId}`] }
    )()
  }
)

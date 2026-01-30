'use server'

import type { DocumentSnapshot } from 'firebase-admin/firestore'
import { cookies } from 'next/headers'
import { adminDb } from '@/lib/firebase-admin'
import { getCurrentAdminProfile } from '@/lib/get-admin'
import type { Event } from '@/types/event'
import type { Registration } from '@/types/registration'
import { revalidatePath } from 'next/cache'

async function getCurrentUserId(): Promise<string> {
  const cookieStore = await cookies()
  const userInfo = cookieStore.get('user-info')?.value
  if (userInfo) {
    try {
      const parsed = JSON.parse(userInfo) as { uid?: string }
      if (parsed.uid) return parsed.uid
    } catch {
      // ignore
    }
  }
  return 'admin'
}

async function canEditOrDeleteEvent(eventId: string): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const profile = await getCurrentAdminProfile(token)
  if (!profile) return false
  if (profile.role === 'superAdmin') return true
  const eventDoc = await adminDb?.collection('events').doc(eventId).get()
  if (!eventDoc?.exists) return false
  return eventDoc.data()?.createdBy === profile.uid
}

export async function getCurrentAdminProfileInServer(): Promise<{ uid: string; role: string; displayName?: string; email?: string } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  return getCurrentAdminProfile(token)
}

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

export async function getAdminEvents(): Promise<Event[]> {
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
    console.error('Error fetching admin events:', error)
    return []
  }
}

export async function getAdminEvent(id: string): Promise<Event | null> {
  if (!adminDb) return null
  try {
    const doc = await adminDb.collection('events').doc(id).get()
    if (!doc.exists) return null
    return toEvent(doc)
  } catch (error) {
    console.error('Error fetching event:', error)
    return null
  }
}

export async function createEvent(
  data: {
    title: string
    description: string
    fullDescription?: string
    date: string
    time?: string
    location: string
    venue?: string
    image?: string
    createdBy?: string
  }
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not available' }
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    const profile = await getCurrentAdminProfile(token)
    const now = new Date()
    const createdBy = profile?.uid ?? data.createdBy ?? (await getCurrentUserId())
    const createdByName = profile?.displayName?.trim() || profile?.email || 'Admin'
    const ref = await adminDb.collection('events').add({
      title: data.title,
      description: data.description,
      date: data.date,
      time: data.time ?? null,
      location: data.location,
      venue: data.venue ?? null,
      image: data.image ?? null,
      fullDescription: data.fullDescription ?? data.description ?? null,
      createdBy,
      createdByName,
      createdAt: now,
      updatedAt: now,
    })
    revalidatePath('/admin')
    revalidatePath('/admin/events')
    revalidatePath('/')
    return { success: true, id: ref.id }
  } catch (error) {
    console.error('Error creating event:', error)
    return { success: false, error: String(error) }
  }
}

export async function updateEvent(
  id: string,
  data: Partial<{
    title: string
    description: string
    fullDescription: string
    date: string
    time: string
    location: string
    venue: string
    image: string
  }>
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not available' }
  const allowed = await canEditOrDeleteEvent(id)
  if (!allowed) {
    return { success: false, error: 'You can only edit events you created. Super admins can edit any event.' }
  }
  try {
    const update: Record<string, unknown> = { updatedAt: new Date() }
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined) update[k] = v
    })
    await adminDb.collection('events').doc(id).update(update)
    revalidatePath('/admin')
    revalidatePath('/admin/events')
    revalidatePath(`/admin/events/${id}`)
    revalidatePath('/')
    revalidatePath(`/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating event:', error)
    return { success: false, error: String(error) }
  }
}

export async function deleteEvent(id: string): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not available' }
  const allowed = await canEditOrDeleteEvent(id)
  if (!allowed) {
    return { success: false, error: 'You can only delete events you created. Super admins can delete any event.' }
  }
  try {
    const ref = adminDb.collection('events').doc(id)
    const regs = await ref.collection('registrations').get()
    const batch = adminDb.batch()
    regs.docs.forEach((d) => batch.delete(d.ref))
    batch.delete(ref)
    await batch.commit()
    revalidatePath('/admin')
    revalidatePath('/admin/events')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Error deleting event:', error)
    return { success: false, error: String(error) }
  }
}

export async function getEventRegistrations(eventId: string): Promise<Registration[]> {
  if (!adminDb) return []
  try {
    const snapshot = await adminDb
      .collection('events')
      .doc(eventId)
      .collection('registrations')
      .get()
    const list: Registration[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      const createdAt = data.createdAt?.toDate?.() ?? data.createdAt
      const pos = data.position
      list.push({
        id: doc.id,
        registrationId: data.registrationId ?? doc.id,
        name: data.name ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        school: data.school ?? '',
        note: data.note ?? '',
        position: typeof pos === 'number' && pos >= 1 && pos <= 20 ? pos : null,
        createdAt: createdAt instanceof Date ? createdAt.toISOString() : (createdAt as string) ?? '',
      })
    })
    list.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime()
      const tb = new Date(b.createdAt).getTime()
      return tb - ta
    })
    return list
  } catch (error) {
    console.error('Error fetching registrations:', error)
    return []
  }
}

/** Update a registration's position (1–20 or null). Only admins who can edit the event may update. */
export async function updateRegistrationPosition(
  eventId: string,
  registrationDocId: string,
  position: number | null
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not available' }
  const allowed = await canEditOrDeleteEvent(eventId)
  if (!allowed) {
    return { success: false, error: 'You can only update registrations for events you can edit.' }
  }
  if (position !== null && (position < 1 || position > 20)) {
    return { success: false, error: 'Position must be between 1 and 20, or empty.' }
  }
  try {
    const ref = adminDb
      .collection('events')
      .doc(eventId)
      .collection('registrations')
      .doc(registrationDocId)
    const doc = await ref.get()
    if (!doc.exists) return { success: false, error: 'Registration not found' }
    await ref.update({ position: position ?? null })
    revalidatePath(`/admin/events/${eventId}`)
    revalidatePath(`/admin/events/${eventId}/registrations`)
    revalidatePath(`/${eventId}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating registration position:', error)
    return { success: false, error: String(error) }
  }
}

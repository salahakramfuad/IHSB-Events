'use server'

import type { DocumentSnapshot } from 'firebase-admin/firestore'
import { cookies } from 'next/headers'
import { unstable_cache } from 'next/cache'
import { adminDb } from '@/lib/firebase-admin'
import { getCurrentAdminProfile } from '@/lib/get-admin'
import type { Event } from '@/types/event'
import type { Registration } from '@/types/registration'
import { revalidatePath, revalidateTag } from 'next/cache'
import { sendAwardeeResultEmail, sendRegistrationDeletedEmail } from '@/lib/brevo'
import { ensureSchoolExists } from '@/lib/schools'

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

export type SchoolWithStats = {
  id: string
  name: string
  createdAt: string
  participants?: number
  winners?: number
}

async function getSchoolStatsFromDb(
  eventId?: string | null
): Promise<Record<string, { participants: number; winners: number }>> {
  if (!adminDb) return {}
  const stats: Record<string, { participants: number; winners: number }> = {}

  if (eventId?.trim()) {
    // Single event: one collection query
    const regsSnap = await adminDb
      .collection('events')
      .doc(eventId.trim())
      .collection('registrations')
      .get()
    regsSnap.docs.forEach((regDoc) => {
      const data = regDoc.data()
      const school = (data.school ?? '').trim() || 'Unknown'
      if (!stats[school]) stats[school] = { participants: 0, winners: 0 }
      stats[school].participants += 1
      const pos = data.position
      if (typeof pos === 'number' && pos >= 1 && pos <= 20) {
        stats[school].winners += 1
      }
    })
  } else {
    // All events: single collectionGroup query instead of N+1
    const regsSnap = await adminDb.collectionGroup('registrations').get()
    regsSnap.docs.forEach((regDoc) => {
      const data = regDoc.data()
      const school = (data.school ?? '').trim() || 'Unknown'
      if (!stats[school]) stats[school] = { participants: 0, winners: 0 }
      stats[school].participants += 1
      const pos = data.position
      if (typeof pos === 'number' && pos >= 1 && pos <= 20) {
        stats[school].winners += 1
      }
    })
  }
  return stats
}

async function fetchSchoolsWithStats(eventId?: string | null): Promise<SchoolWithStats[]> {
  if (!adminDb) return []
  try {
    const [schoolsSnap, stats] = await Promise.all([
      adminDb.collection('schools').orderBy('name').get(),
      getSchoolStatsFromDb(eventId),
    ])
    return schoolsSnap.docs.map((doc) => {
      const data = doc.data()
      const createdAt = data.createdAt?.toDate?.() ?? data.createdAt
      const name = data.name ?? ''
      const sStats = stats[name] ?? { participants: 0, winners: 0 }
      return {
        id: doc.id,
        name,
        createdAt: createdAt instanceof Date ? createdAt.toISOString() : String(createdAt ?? ''),
        participants: sStats.participants,
        winners: sStats.winners,
      }
    })
  } catch (error) {
    console.error('getSchoolsWithStats error:', error)
    return []
  }
}

export async function getSchoolsWithStats(eventId?: string | null): Promise<SchoolWithStats[]> {
  return unstable_cache(
    () => fetchSchoolsWithStats(eventId),
    ['schools-with-stats', eventId ?? 'all'],
    { revalidate: 60, tags: ['schools', 'admin-dashboard', eventId ? `event-${eventId}` : 'events'] }
  )()
}

export async function getAdmins(): Promise<
  { list: { uid: string; email: string; role: string; displayName?: string; photoURL?: string }[]; forbidden: boolean }
> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const profile = await getCurrentAdminProfile(token)
  if (!profile || profile.role !== 'superAdmin') {
    return { list: [], forbidden: true }
  }
  const { getAdminList } = await import('@/lib/get-admin')
  const list = await getAdminList()
  return {
    list: list.map((a) => ({
      uid: a.uid,
      email: a.email,
      role: a.role,
      displayName: a.displayName,
      photoURL: a.photoURL,
    })),
    forbidden: false,
  }
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
    logo?: string
    categories?: string[]
    colorTheme?: string
    isPaid?: boolean
    sendPdfOnRegistration?: boolean
    amount?: number
    categoryAmounts?: Record<string, number>
    contactPersons?: { name: string; phone: string; position?: string }[]
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
    const categories = Array.isArray(data.categories) ? data.categories.filter((c) => String(c).trim()) : []
    const ref = await adminDb.collection('events').add({
      title: data.title,
      description: data.description,
      date: data.date,
      time: data.time ?? null,
      location: data.location,
      venue: data.venue ?? null,
      image: data.image ?? null,
      logo: data.logo ?? null,
      fullDescription: data.fullDescription ?? data.description ?? null,
      categories: categories.length > 0 ? categories : null,
      colorTheme: data.colorTheme?.trim() || null,
      sendPdfOnRegistration: data.sendPdfOnRegistration ?? true,
      isPaid: data.isPaid ?? false,
      amount:
        data.isPaid && typeof data.amount === 'number' && data.amount >= 0
          ? data.amount
          : null,
      categoryAmounts:
        data.categoryAmounts && Object.keys(data.categoryAmounts).length > 0
          ? data.categoryAmounts
          : null,
      contactPersons:
        Array.isArray(data.contactPersons) && data.contactPersons.length > 0
          ? data.contactPersons
              .filter(
                (p) => p && (String(p.name ?? '').trim() || String(p.phone ?? '').trim())
              )
              .map((p) => ({
                name: String(p.name ?? '').trim(),
                phone: String(p.phone ?? '').trim(),
                position: String(p.position ?? '').trim() || undefined,
              }))
          : null,
      createdBy,
      createdByName,
      createdAt: now,
      updatedAt: now,
    })
    revalidatePath('/admin')
    revalidatePath('/admin/events')
    revalidatePath('/')
    revalidateTag('events', 'max')
    revalidateTag('admin-dashboard', 'max')
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
    logo: string
    categories: string[]
    colorTheme: string
    sendPdfOnRegistration: boolean
    isPaid: boolean
    amount: number
    categoryAmounts: Record<string, number>
    contactPersons: { name: string; phone: string; position?: string }[]
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
      if (v === undefined) return
      if (k === 'categories') {
        const arr = Array.isArray(v) ? v.filter((c) => String(c).trim()) : []
        update[k] = arr.length > 0 ? arr : null
      } else if (k === 'isPaid') {
        update[k] = v
        if (!v) {
          update.amount = null
          update.categoryAmounts = null
        }
      } else if (k === 'amount') {
        update[k] = data.isPaid && typeof v === 'number' && v >= 0 ? v : null
      } else if (k === 'categoryAmounts') {
        update[k] =
          v && typeof v === 'object' && Object.keys(v).length > 0 ? v : null
      } else if (k === 'contactPersons') {
        const arr = Array.isArray(v)
          ? (v as { name?: string; phone?: string; position?: string }[])
            .filter((p) => p && typeof p === 'object' && (String(p.name ?? '').trim() || String(p.phone ?? '').trim()))
            .map((p) => ({
              name: String(p.name ?? '').trim(),
              phone: String(p.phone ?? '').trim(),
              position: String(p.position ?? '').trim() || undefined,
            }))
          : []
        update[k] = arr.length > 0 ? arr : null
      } else {
        update[k] = v
      }
    })
    await adminDb.collection('events').doc(id).update(update)
    revalidatePath('/admin')
    revalidatePath('/admin/events')
    revalidatePath(`/admin/events/${id}`)
    revalidatePath('/')
    revalidatePath(`/${id}`)
    revalidateTag('events', 'max')
    revalidateTag('admin-dashboard', 'max')
    revalidateTag(`event-${id}`, 'max')
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
    revalidateTag('events', 'max')
    revalidateTag('admin-dashboard', 'max')
    revalidateTag(`event-${id}`, 'max')
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
      let resultNotifiedAtRaw = data.resultNotifiedAt?.toDate?.() ?? data.resultNotifiedAt
      if (resultNotifiedAtRaw && typeof resultNotifiedAtRaw === 'object' && '_seconds' in resultNotifiedAtRaw) {
        resultNotifiedAtRaw = new Date((resultNotifiedAtRaw as { _seconds: number })._seconds * 1000)
      }
      const resultNotifiedAt =
        resultNotifiedAtRaw instanceof Date
          ? resultNotifiedAtRaw.toISOString()
          : typeof resultNotifiedAtRaw === 'string'
            ? resultNotifiedAtRaw
            : null

      list.push({
        id: doc.id,
        registrationId: data.registrationId ?? doc.id,
        name: data.name ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        school: data.school ?? '',
        note: data.note ?? '',
        category: data.category ?? undefined,
        position: typeof pos === 'number' && pos >= 1 && pos <= 20 ? pos : null,
        paymentStatus: data.paymentStatus ?? undefined,
        bkashTrxId: data.bkashTrxId ?? undefined,
        resultNotifiedAt: resultNotifiedAt ?? undefined,
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
    revalidateTag('schools', 'max')
    return { success: true }
  } catch (error) {
    console.error('Error updating registration position:', error)
    return { success: false, error: String(error) }
  }
}

/** Delete a registration. Super admins only. Sends notification email to the registree. */
export async function deleteRegistration(
  eventId: string,
  registrationDocId: string
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not available' }
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const profile = await getCurrentAdminProfile(token)
  if (profile?.role !== 'superAdmin') {
    return { success: false, error: 'Only super admins can delete registrations.' }
  }
  try {
    const regRef = adminDb
      .collection('events')
      .doc(eventId)
      .collection('registrations')
      .doc(registrationDocId)
    const regDoc = await regRef.get()
    if (!regDoc.exists) return { success: false, error: 'Registration not found' }

    const regData = regDoc.data()!
    const event = await getAdminEvent(eventId)
    if (!event) return { success: false, error: 'Event not found' }

    await regRef.delete()
    revalidatePath(`/admin/events/${eventId}`)
    revalidatePath(`/admin/events/${eventId}/registrations`)
    revalidatePath(`/${eventId}`)
    revalidateTag('schools', 'max')

    const email = (regData.email ?? '').trim().toLowerCase()
    const name = (regData.name ?? '').trim() || 'Registrant'
    const registrationId = regData.registrationId ?? registrationDocId
    if (email) {
      const emailResult = await sendRegistrationDeletedEmail({
        to: email,
        name,
        event,
        registrationId,
      })
      if (!emailResult.success) {
        console.error('Failed to send registration-deleted notification:', emailResult.error)
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting registration:', error)
    return { success: false, error: String(error) }
  }
}

/** Update registration info (name, email, phone, school, note, category). Super admins only. */
export async function updateRegistration(
  eventId: string,
  registrationDocId: string,
  data: { name?: string; email?: string; phone?: string; school?: string; note?: string; category?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not available' }
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const profile = await getCurrentAdminProfile(token)
  if (profile?.role !== 'superAdmin') {
    return { success: false, error: 'Only super admins can edit registration details.' }
  }
  try {
    const regRef = adminDb
      .collection('events')
      .doc(eventId)
      .collection('registrations')
      .doc(registrationDocId)
    const regDoc = await regRef.get()
    if (!regDoc.exists) return { success: false, error: 'Registration not found' }

    const update: Record<string, unknown> = {}
    if (data.name != null && data.name.trim()) update.name = data.name.trim()
    if (data.phone != null) update.phone = String(data.phone).trim()
    if (data.school != null && data.school.trim()) {
      await ensureSchoolExists(data.school.trim())
      update.school = data.school.trim()
    }
    if (data.note != null) update.note = String(data.note).trim()
    if (data.category != null) update.category = String(data.category).trim() || null

    if (data.email != null) {
      const email = String(data.email).trim().toLowerCase()
      if (!email) return { success: false, error: 'Email is required.' }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) return { success: false, error: 'Invalid email format.' }
      const regData = regDoc.data()!
      const currentEmail = (regData.email ?? '').toLowerCase()
      if (email !== currentEmail) {
        const existing = await adminDb
          .collection('events')
          .doc(eventId)
          .collection('registrations')
          .where('email', '==', email)
          .limit(1)
          .get()
        if (!existing.empty) {
          return { success: false, error: 'Another registration already exists with this email.' }
        }
      }
      update.email = email
    }

    if (Object.keys(update).length === 0) {
      return { success: true }
    }

    await regRef.update(update)
    revalidatePath(`/admin/events/${eventId}`)
    revalidatePath(`/admin/events/${eventId}/registrations`)
    revalidatePath(`/${eventId}`)
    revalidateTag('schools', 'max')
    return { success: true }
  } catch (error) {
    console.error('Error updating registration:', error)
    return { success: false, error: String(error) }
  }
}

/** Send result notification email to a single awardee and mark as notified. */
export async function notifySingleAwardee(
  eventId: string,
  registrationDocId: string
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not available' }
  const allowed = await canEditOrDeleteEvent(eventId)
  if (!allowed) {
    return { success: false, error: 'You can only notify awardees for events you can edit.' }
  }
  try {
    const eventDoc = await adminDb.collection('events').doc(eventId).get()
    if (!eventDoc.exists) return { success: false, error: 'Event not found' }

    const regRef = adminDb
      .collection('events')
      .doc(eventId)
      .collection('registrations')
      .doc(registrationDocId)
    const regDoc = await regRef.get()
    if (!regDoc.exists) return { success: false, error: 'Registration not found' }

    const regData = regDoc.data()!
    const pos = regData.position
    if (typeof pos !== 'number' || pos < 1 || pos > 20) {
      return { success: false, error: 'This applicant does not have an assigned position (1st–20th).' }
    }

    if (regData.resultNotifiedAt) {
      return { success: false, error: 'This awardee has already been notified.' }
    }

    const eventData = eventDoc.data()!
    let dateValue = eventData.date
    if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue) {
      dateValue = (dateValue as { toDate: () => Date }).toDate().toISOString().split('T')[0]
    } else if (dateValue && typeof dateValue === 'object' && '_seconds' in dateValue) {
      dateValue = new Date((dateValue as { _seconds: number })._seconds * 1000).toISOString().split('T')[0]
    }

    const eventForEmail: Event = {
      id: eventDoc.id,
      ...eventData,
      date: dateValue as string,
      title: eventData.title ?? 'Event',
      location: eventData.location ?? '',
      description: eventData.description ?? '',
      venue: eventData.venue ?? eventData.location ?? '',
      createdAt: eventData.createdAt?.toDate?.() ?? eventData.createdAt,
      updatedAt: eventData.updatedAt?.toDate?.() ?? eventData.updatedAt,
      createdBy: eventData.createdBy ?? '',
    }

    const result = await sendAwardeeResultEmail({
      to: regData.email ?? '',
      name: regData.name ?? '',
      event: eventForEmail,
      position: pos,
      category: regData.category ?? undefined,
    })

    if (!result.success) {
      return { success: false, error: result.error ?? 'Failed to send email.' }
    }

    const now = new Date()
    await regRef.update({ resultNotifiedAt: now })

    revalidatePath(`/admin/events/${eventId}`)
    revalidatePath(`/admin/events/${eventId}/registrations`)
    revalidatePath(`/${eventId}`)
    revalidateTag(`event-${eventId}`, 'max')

    return { success: true }
  } catch (error) {
    console.error('Error notifying awardee:', error)
    return { success: false, error: String(error) }
  }
}

/** Publish awardee results: send emails to all registrants with position 1–20. */
export async function publishEventResults(
  eventId: string
): Promise<{ success: boolean; sent?: number; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not available' }
  const allowed = await canEditOrDeleteEvent(eventId)
  if (!allowed) {
    return { success: false, error: 'You can only publish results for events you can edit.' }
  }
  try {
    const eventDoc = await adminDb.collection('events').doc(eventId).get()
    if (!eventDoc.exists) return { success: false, error: 'Event not found' }
    const eventData = eventDoc.data()!
    if (eventData.resultsPublishedAt) {
      return { success: false, error: 'Results have already been published for this event.' }
    }

    const regsSnap = await adminDb
      .collection('events')
      .doc(eventId)
      .collection('registrations')
      .get()

    const awardees: { docId: string; name: string; email: string; position: number; category?: string }[] = []
    regsSnap.forEach((doc) => {
      const data = doc.data()
      const pos = data.position
      if (typeof pos === 'number' && pos >= 1 && pos <= 20) {
        const regId = data.registrationId ?? doc.id
        awardees.push({
          docId: doc.id,
          name: (data.name ?? data.fullName ?? data.studentName ?? regId ?? '').trim() || 'Awardee',
          email: data.email ?? '',
          position: pos,
          category: data.category ?? undefined,
        })
      }
    })

    if (awardees.length === 0) {
      return { success: false, error: 'No awardees found. Assign positions (1st–20th) to registrants first.' }
    }

    awardees.sort((a, b) => a.position - b.position)

    // Update event first so awardees appear on public page immediately, then send emails in parallel
    const now = new Date()
    await adminDb.collection('events').doc(eventId).update({
      resultsPublishedAt: now,
      updatedAt: now,
    })
    revalidatePath(`/admin/events/${eventId}`)
    revalidatePath(`/admin/events/${eventId}/registrations`)
    revalidatePath(`/${eventId}`)
    revalidateTag('events', 'max')
    revalidateTag('admin-dashboard', 'max')
    revalidateTag(`event-${eventId}`, 'max')

    const firstDate = eventData.date
    let dateValue = firstDate
    if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue) {
      dateValue = (dateValue as { toDate: () => Date }).toDate().toISOString().split('T')[0]
    } else if (dateValue && typeof dateValue === 'object' && '_seconds' in dateValue) {
      dateValue = new Date((dateValue as { _seconds: number })._seconds * 1000).toISOString().split('T')[0]
    }

    const eventForEmail: Event = {
      id: eventDoc.id,
      ...eventData,
      date: dateValue as string,
      title: eventData.title ?? 'Event',
      location: eventData.location ?? '',
      description: eventData.description ?? '',
      venue: eventData.venue ?? eventData.location ?? '',
      createdAt: eventData.createdAt?.toDate?.() ?? eventData.createdAt,
      updatedAt: eventData.updatedAt?.toDate?.() ?? eventData.updatedAt,
      createdBy: eventData.createdBy ?? '',
    }

    // Send confirmation emails in parallel and set resultNotifiedAt on each registration
    const emailPromises = awardees
      .filter((a) => a.email?.trim())
      .map((a) =>
        sendAwardeeResultEmail({
          to: a.email!,
          name: a.name,
          event: eventForEmail,
          position: a.position,
          category: a.category,
        })
      )
    const results = await Promise.all(emailPromises)
    const sent = results.filter((r) => r.success).length

    // Mark each awardee as notified so they appear on the public page
    const regsRef = adminDb.collection('events').doc(eventId).collection('registrations')
    await Promise.all(
      awardees.map((a) => regsRef.doc(a.docId).update({ resultNotifiedAt: now }))
    )

    return { success: true, sent }
  } catch (error) {
    console.error('Error publishing results:', error)
    return { success: false, error: String(error) }
  }
}

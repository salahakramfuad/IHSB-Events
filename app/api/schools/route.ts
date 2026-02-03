import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { adminDb } from '@/lib/firebase-admin'
import { getCurrentAdminProfile } from '@/lib/get-admin'

export type School = {
  id: string
  name: string
  createdAt: string
  participants?: number
  winners?: number
}

async function getSchoolStats(
  eventId?: string | null
): Promise<Record<string, { participants: number; winners: number }>> {
  if (!adminDb) return {}
  const stats: Record<string, { participants: number; winners: number }> = {}

  if (eventId?.trim()) {
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

export async function GET(request: NextRequest) {
  if (!adminDb) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
  const { searchParams } = new URL(request.url)
  const includeStats = searchParams.get('stats') === '1'
  const eventId = searchParams.get('eventId') || undefined
  try {
    const snapshot = await adminDb.collection('schools').orderBy('name').get()
    let schools: School[] = snapshot.docs.map((doc) => {
      const data = doc.data()
      const createdAt = data.createdAt?.toDate?.() ?? data.createdAt
      return {
        id: doc.id,
        name: data.name ?? '',
        createdAt: createdAt instanceof Date ? createdAt.toISOString() : String(createdAt ?? ''),
      }
    })
    if (includeStats) {
      const stats = await getSchoolStats(eventId)
      schools = schools.map((s) => {
        const sStats = stats[s.name] ?? { participants: 0, winners: 0 }
        return { ...s, participants: sStats.participants, winners: sStats.winners }
      })
    }
    return NextResponse.json(schools, {
      headers: { 'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120' },
    })
  } catch (error) {
    console.error('GET /api/schools error:', error)
    return NextResponse.json({ error: 'Failed to fetch schools' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!adminDb) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
  try {
    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) {
      return NextResponse.json({ error: 'School name is required' }, { status: 400 })
    }

    const token = request.cookies.get('auth-token')?.value
    const profile = await getCurrentAdminProfile(token)
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const docRef = await adminDb.collection('schools').add({
      name,
      createdAt: now,
    })

    const school: School = {
      id: docRef.id,
      name,
      createdAt: now.toISOString(),
    }
    revalidateTag('schools', 'max')
    return NextResponse.json(school, { status: 201 })
  } catch (error) {
    console.error('POST /api/schools error:', error)
    return NextResponse.json({ error: 'Failed to create school' }, { status: 500 })
  }
}

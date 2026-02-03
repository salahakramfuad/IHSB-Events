import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { getCurrentAdminProfile } from '@/lib/get-admin'

export type School = {
  id: string
  name: string
  createdAt: string
}

export async function GET() {
  if (!adminDb) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
  try {
    const snapshot = await adminDb.collection('schools').orderBy('name').get()
    const schools: School[] = snapshot.docs.map((doc) => {
      const data = doc.data()
      const createdAt = data.createdAt?.toDate?.() ?? data.createdAt
      return {
        id: doc.id,
        name: data.name ?? '',
        createdAt: createdAt instanceof Date ? createdAt.toISOString() : String(createdAt ?? ''),
      }
    })
    return NextResponse.json(schools)
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
    return NextResponse.json(school, { status: 201 })
  } catch (error) {
    console.error('POST /api/schools error:', error)
    return NextResponse.json({ error: 'Failed to create school' }, { status: 500 })
  }
}

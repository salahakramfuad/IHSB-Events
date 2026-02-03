import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { getCurrentAdminProfile } from '@/lib/get-admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!adminDb) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const token = request.cookies.get('auth-token')?.value
  const profile = await getCurrentAdminProfile(token)
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) {
      return NextResponse.json({ error: 'School name is required' }, { status: 400 })
    }

    const docRef = adminDb.collection('schools').doc(id)
    const doc = await docRef.get()
    if (!doc.exists) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    await docRef.update({ name })
    const data = doc.data()!
    const createdAt = data.createdAt?.toDate?.() ?? data.createdAt
    return NextResponse.json({
      id,
      name,
      createdAt: createdAt instanceof Date ? createdAt.toISOString() : String(createdAt ?? ''),
    })
  } catch (error) {
    console.error('PATCH /api/schools/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update school' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!adminDb) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const token = _request.cookies.get('auth-token')?.value
  const profile = await getCurrentAdminProfile(token)
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const docRef = adminDb.collection('schools').doc(id)
    const doc = await docRef.get()
    if (!doc.exists) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    await docRef.delete()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/schools/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete school' }, { status: 500 })
  }
}

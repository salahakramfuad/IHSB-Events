import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdminProfile } from '@/lib/get-admin'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const token = request.cookies.get('auth-token')?.value
  const current = await getCurrentAdminProfile(token)
  if (!current) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (current.role !== 'superAdmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { uid } = await params
  if (!uid) {
    return NextResponse.json({ error: 'Missing uid' }, { status: 400 })
  }

  let body: { displayName?: string; photoURL?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const updates: { displayName?: string; photoURL?: string; password?: string } = {}
  if (typeof body.displayName === 'string') updates.displayName = body.displayName.trim() || undefined
  if (typeof body.photoURL === 'string') updates.photoURL = body.photoURL.trim() || undefined
  if (typeof body.password === 'string' && body.password.length >= 6) updates.password = body.password

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid updates' }, { status: 400 })
  }

  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const authUpdate: { displayName?: string; photoURL?: string; password?: string } = {}
    if (updates.displayName !== undefined) authUpdate.displayName = updates.displayName
    if (updates.photoURL !== undefined) authUpdate.photoURL = updates.photoURL
    if (updates.password !== undefined) authUpdate.password = updates.password

    if (Object.keys(authUpdate).length > 0) {
      await adminAuth.updateUser(uid, authUpdate)
    }

    const firestoreUpdate: Record<string, unknown> = { updatedAt: new Date() }
    if (updates.displayName !== undefined) firestoreUpdate.displayName = updates.displayName || null
    if (updates.photoURL !== undefined) firestoreUpdate.photoURL = updates.photoURL || null

    if (Object.keys(firestoreUpdate).length > 1) {
      await adminDb.collection('admins').doc(uid).set(firestoreUpdate, { merge: true })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update admin error:', error)
    return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const token = request.cookies.get('auth-token')?.value
  const current = await getCurrentAdminProfile(token)
  if (!current) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (current.role !== 'superAdmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { uid } = await params
  if (!uid) {
    return NextResponse.json({ error: 'Missing uid' }, { status: 400 })
  }

  if (uid === current.uid) {
    return NextResponse.json(
      { error: 'You cannot delete your own account' },
      { status: 400 }
    )
  }

  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }
    await adminAuth.deleteUser(uid)
    await adminDb.collection('admins').doc(uid).delete()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete admin error:', error)
    return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 })
  }
}

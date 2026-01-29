import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdminProfile } from '@/lib/get-admin'
import { getAdminList } from '@/lib/get-admin'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const profile = await getCurrentAdminProfile(token)
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (profile.role !== 'superAdmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const list = await getAdminList()
    return NextResponse.json(list)
  } catch (error) {
    console.error('List admins error:', error)
    return NextResponse.json({ error: 'Failed to list admins' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const profile = await getCurrentAdminProfile(token)
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (profile.role !== 'superAdmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { email?: string; password?: string; displayName?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : ''

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters' },
      { status: 400 }
    )
  }

  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: displayName || undefined,
      emailVerified: false,
    })
    const uid = userRecord.uid

    await adminAuth.setCustomUserClaims(uid, { role: 'admin' })
    await adminDb.collection('admins').doc(uid).set(
      {
        email,
        role: 'admin',
        displayName: displayName || null,
        photoURL: null,
        updatedAt: new Date(),
      },
      { merge: true }
    )

    return NextResponse.json({
      success: true,
      uid,
      email,
      displayName: displayName || null,
    })
  } catch (error: unknown) {
    const msg = error && typeof error === 'object' && 'message' in error
      ? String((error as { message: string }).message)
      : 'Failed to create admin'
    console.error('Create admin error:', error)
    if (msg.includes('email') && msg.includes('already')) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

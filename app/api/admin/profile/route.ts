import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdminProfile } from '@/lib/get-admin'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export async function PATCH(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const profile = await getCurrentAdminProfile(token)
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { displayName?: string; photoURL?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { displayName, photoURL } = body
  const updates: { displayName?: string; photoURL?: string } = {}
  if (typeof displayName === 'string') updates.displayName = displayName.trim() || null
  if (typeof photoURL === 'string') updates.photoURL = photoURL.trim() || null

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(profile)
  }

  try {
    if (adminAuth) {
      await adminAuth.updateUser(profile.uid, {
        displayName: updates.displayName ?? undefined,
        photoURL: updates.photoURL ?? undefined,
      })
    }
    if (adminDb) {
      await adminDb.collection('admins').doc(profile.uid).set(
        {
          ...updates,
          updatedAt: new Date(),
        },
        { merge: true }
      )
    }
    return NextResponse.json({
      ...profile,
      displayName: updates.displayName ?? profile.displayName,
      photoURL: updates.photoURL ?? profile.photoURL,
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

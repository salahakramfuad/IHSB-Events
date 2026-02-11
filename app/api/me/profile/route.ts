import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { getCurrentUser } from '@/lib/get-current-user'
import { ensureSchoolExists } from '@/lib/schools'

export type StudentProfile = {
  uid: string
  email: string
  role: string | null
  displayName: string | null
  school: string | null
  grade: string | null
  phone: string | null
  updatedAt: string | null
  signInProvider: string | null
}

async function getMergedProfile(token: string | undefined): Promise<StudentProfile | null> {
  const user = await getCurrentUser(token)
  if (!user) return null

  let displayName: string | null = null
  let school: string | null = null
  let grade: string | null = null
  let phone: string | null = null
  let updatedAt: string | null = null
  let signInProvider: string | null = null

  if (adminAuth && token) {
    try {
      const decoded = await adminAuth.verifyIdToken(token)
      const firebaseClaim = decoded.firebase as { sign_in_provider?: string } | undefined
      signInProvider = firebaseClaim?.sign_in_provider ?? null
    } catch {
      // ignore
    }
  }

  if (adminDb) {
    try {
      const doc = await adminDb.collection('students').doc(user.uid).get()
      if (doc.exists) {
        const data = doc.data()
        displayName = (data?.displayName as string)?.trim() ?? null
        school = (data?.school as string)?.trim() ?? null
        grade = (data?.grade as string)?.trim() ?? null
        phone = (data?.phone as string)?.trim() ?? null
        const u = data?.updatedAt
        updatedAt =
          u?.toDate?.()?.toISOString?.() ?? (typeof u === 'string' ? u : null)
      }
    } catch {
      // ignore
    }
  }

  return {
    uid: user.uid,
    email: user.email,
    role: user.role,
    displayName,
    school,
    grade,
    phone,
    updatedAt,
    signInProvider,
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const profile = await getMergedProfile(token)
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ profile })
}

export async function PATCH(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const user = await getCurrentUser(token)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { displayName?: string; school?: string; grade?: string; phone?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (typeof body.displayName === 'string') {
    updates.displayName = body.displayName.trim() || null
  }
  if (typeof body.school === 'string') {
    const trimmed = body.school.trim()
    updates.school = trimmed || null
    if (trimmed) await ensureSchoolExists(trimmed)
  }
  if (typeof body.grade === 'string') {
    updates.grade = body.grade.trim() || null
  }
  if (typeof body.phone === 'string') {
    updates.phone = body.phone.trim() || null
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  try {
    const ref = adminDb.collection('students').doc(user.uid)
    await ref.set(updates, { merge: true })
    const profile = await getMergedProfile(token)
    return NextResponse.json({ profile })
  } catch (error) {
    console.error('PATCH /api/me/profile error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

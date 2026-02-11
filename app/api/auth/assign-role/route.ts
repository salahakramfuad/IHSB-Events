import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

const ALL_ADMIN_EMAILS = new Set([...SUPER_ADMIN_EMAILS, ...ADMIN_EMAILS])

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { idToken } = body
    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })
    }

    if (!adminAuth) {
      return NextResponse.json({ error: 'Auth not configured' }, { status: 500 })
    }

    const decoded = await adminAuth.verifyIdToken(idToken)
    const uid = decoded.uid
    const email = (decoded.email as string)?.toLowerCase() ?? ''

    // Env whitelist: SUPER_ADMIN_EMAILS and ADMIN_EMAILS
    if (ALL_ADMIN_EMAILS.size && ALL_ADMIN_EMAILS.has(email)) {
      const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(email)
      const role = isSuperAdmin ? 'superAdmin' : 'admin'
      await adminAuth.setCustomUserClaims(uid, { role })
      if (adminDb) {
        const adminsRef = adminDb.collection('admins').doc(uid)
        const payload: Record<string, unknown> = { email, role, updatedAt: new Date() }
        if (decoded.name) payload.displayName = decoded.name
        if (decoded.picture) payload.photoURL = decoded.picture
        await adminsRef.set(payload, { merge: true })
      }
      return NextResponse.json({ success: true, role })
    }

    // Admins created by super admin (have admins doc but may not be in env)
    if (adminDb) {
      const adminDoc = await adminDb.collection('admins').doc(uid).get()
      if (adminDoc.exists) {
        const data = adminDoc.data()
        const role = (data?.role as 'admin' | 'superAdmin') ?? 'admin'
        await adminAuth.setCustomUserClaims(uid, { role })
        await adminDb.collection('admins').doc(uid).set(
          { email, updatedAt: new Date() },
          { merge: true }
        )
        return NextResponse.json({ success: true, role })
      }
    }

    await adminAuth.setCustomUserClaims(uid, { role: 'student' })
    return NextResponse.json({ success: true, role: 'student' })
  } catch (error) {
    console.error('assign-role error:', error)
    return NextResponse.json({ error: 'Failed to assign role' }, { status: 500 })
  }
}

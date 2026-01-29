import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdminProfile } from '@/lib/get-admin'
import { adminAuth } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const profile = await getCurrentAdminProfile(token)
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { newPassword?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const newPassword = typeof body.newPassword === 'string' ? body.newPassword.trim() : ''
  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters' },
      { status: 400 }
    )
  }

  try {
    if (!adminAuth) {
      return NextResponse.json({ error: 'Auth not configured' }, { status: 500 })
    }
    await adminAuth.updateUser(profile.uid, { password: newPassword })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Password update error:', error)
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
  }
}

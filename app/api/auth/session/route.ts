import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'

const SESSION_DURATION_MS = 30 * 60 * 1000

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { idToken, user } = body
    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })
    }

    if (!adminAuth) {
      return NextResponse.json({ error: 'Auth not configured' }, { status: 500 })
    }

    await adminAuth.verifyIdToken(idToken)

    const response = NextResponse.json({ success: true })
    response.cookies.set('auth-token', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: Math.floor(SESSION_DURATION_MS / 1000),
      path: '/',
    })
    response.cookies.set('session-start', String(Date.now()), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: Math.floor(SESSION_DURATION_MS / 1000),
      path: '/',
    })
    if (user && typeof user === 'object') {
      response.cookies.set('user-info', JSON.stringify({ uid: user.uid, email: user.email }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: Math.floor(SESSION_DURATION_MS / 1000),
        path: '/',
      })
    }
    return response
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}

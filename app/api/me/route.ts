import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-current-user'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const user = await getCurrentUser(token)

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  return NextResponse.json({ user })
}


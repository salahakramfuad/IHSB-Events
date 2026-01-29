import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdminProfile } from '@/lib/get-admin'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const profile = await getCurrentAdminProfile(token)
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json(profile)
}

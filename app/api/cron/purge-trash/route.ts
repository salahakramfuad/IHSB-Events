import { NextRequest, NextResponse } from 'next/server'
import { purgeExpiredTrash } from '@/app/admin/actions'

/**
 * Cron endpoint to permanently delete items in trash older than 30 days.
 * Configure in vercel.json. Requires CRON_SECRET for authorization.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await purgeExpiredTrash()
    return NextResponse.json({
      success: true,
      eventsPurged: result.eventsPurged,
      registrationsPurged: result.registrationsPurged,
    })
  } catch (error) {
    console.error('Purge trash cron error:', error)
    return NextResponse.json(
      { error: 'Failed to purge trash' },
      { status: 500 }
    )
  }
}

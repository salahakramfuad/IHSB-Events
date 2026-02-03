import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { verified: false, message: 'Registration ID is required' },
        { status: 400 }
      )
    }

    if (!adminDb) {
      return NextResponse.json(
        { verified: false, message: 'Database not configured' },
        { status: 500 }
      )
    }

    // Single collectionGroup query - O(1) reads instead of O(events * regs)
    const snap = await adminDb
      .collectionGroup('registrations')
      .where('registrationId', '==', id)
      .limit(1)
      .get()

    if (!snap.empty) {
      const regDoc = snap.docs[0]
      const data = regDoc.data()
      const eventId = regDoc.ref.parent.parent?.id
      if (eventId) {
        const eventDoc = await adminDb.collection('events').doc(eventId).get()
        const eventData = eventDoc.exists ? eventDoc.data() : {}
        return NextResponse.json({
          verified: true,
          name: data.name || 'Unknown',
          school: data.school || '',
          eventTitle: eventData?.title || 'Unknown Event',
          eventId,
          registrationId: id,
          category: data.category || null,
          position: data.position || null,
        })
      }
    }

    // Fallback: try by document ID
    const eventsSnapshot = await adminDb.collection('events').limit(100).get()
    for (const eventDoc of eventsSnapshot.docs) {
      const byDocId = await eventDoc.ref.collection('registrations').doc(id).get()
      if (byDocId.exists) {
        const data = byDocId.data()
        const eventData = eventDoc.data()
        return NextResponse.json({
          verified: true,
          name: data?.name || 'Unknown',
          school: data?.school || '',
          eventTitle: eventData?.title || 'Unknown Event',
          eventId: eventDoc.id,
          registrationId: data?.registrationId || id,
          category: data?.category || null,
          position: data?.position || null,
        })
      }
    }

    return NextResponse.json({
      verified: false,
      message: 'Registration not found',
    })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { verified: false, message: 'Verification failed' },
      { status: 500 }
    )
  }
}

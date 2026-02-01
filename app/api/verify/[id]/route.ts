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

    // Search for registration by registrationId field or document ID
    const eventsSnapshot = await adminDb.collection('events').get()
    
    for (const eventDoc of eventsSnapshot.docs) {
      const registrationsRef = adminDb
        .collection('events')
        .doc(eventDoc.id)
        .collection('registrations')

      // Try to find by registrationId field
      const byRegIdQuery = await registrationsRef
        .where('registrationId', '==', id)
        .limit(1)
        .get()

      if (!byRegIdQuery.empty) {
        const regDoc = byRegIdQuery.docs[0]
        const data = regDoc.data()
        const eventData = eventDoc.data()
        
        return NextResponse.json({
          verified: true,
          name: data.name || 'Unknown',
          school: data.school || '',
          eventTitle: eventData.title || 'Unknown Event',
          eventId: eventDoc.id,
          registrationId: id,
          category: data.category || null,
          position: data.position || null,
        })
      }

      // Try to find by document ID
      const byDocId = await registrationsRef.doc(id).get()
      if (byDocId.exists) {
        const data = byDocId.data()
        const eventData = eventDoc.data()
        
        return NextResponse.json({
          verified: true,
          name: data?.name || 'Unknown',
          school: data?.school || '',
          eventTitle: eventData.title || 'Unknown Event',
          eventId: eventDoc.id,
          registrationId: data?.registrationId || id,
          category: data?.category || null,
          position: data?.position || null,
        })
      }
    }

    // Not found
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

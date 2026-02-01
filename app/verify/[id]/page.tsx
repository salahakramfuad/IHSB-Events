import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle, XCircle, ArrowLeft, User, School, Calendar, Award, Hash } from 'lucide-react'
import { adminDb } from '@/lib/firebase-admin'

export const metadata: Metadata = {
  title: 'Verify Registration | International Hope School Bangladesh',
  description: 'Verify event registration',
}

interface VerificationResult {
  verified: boolean
  name?: string
  school?: string
  eventTitle?: string
  eventId?: string
  registrationId?: string
  category?: string | null
  position?: number | null
  message?: string
}

async function verifyRegistration(id: string): Promise<VerificationResult> {
  try {
    if (!adminDb) {
      return { verified: false, message: 'Database not configured' }
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
        
        return {
          verified: true,
          name: data.name || 'Unknown',
          school: data.school || '',
          eventTitle: eventData.title || 'Unknown Event',
          eventId: eventDoc.id,
          registrationId: id,
          category: data.category || null,
          position: data.position || null,
        }
      }

      // Try to find by document ID
      const byDocId = await registrationsRef.doc(id).get()
      if (byDocId.exists) {
        const data = byDocId.data()
        const eventData = eventDoc.data()
        
        return {
          verified: true,
          name: data?.name || 'Unknown',
          school: data?.school || '',
          eventTitle: eventData.title || 'Unknown Event',
          eventId: eventDoc.id,
          registrationId: data?.registrationId || id,
          category: data?.category || null,
          position: data?.position || null,
        }
      }
    }

    // Not found
    return { verified: false, message: 'Registration not found' }
  } catch (error) {
    console.error('Verification error:', error)
    return { verified: false, message: 'Verification failed' }
  }
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await verifyRegistration(id)

  const positionLabel = (n: number) =>
    n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-lg px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <Image
              src="/logo.png"
              alt="IHSB"
              width={60}
              height={60}
              className="mx-auto rounded-xl"
            />
          </Link>
          <h1 className="mt-4 text-xl font-bold text-slate-900">
            International Hope School Bangladesh
          </h1>
          <p className="mt-1 text-sm text-slate-500">Registration Verification</p>
        </div>

        {/* Verification Result */}
        {result.verified ? (
          <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-lg">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-8 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Verified</h2>
              <p className="mt-1 text-emerald-100">Registration is valid</p>
            </div>

            {/* Details */}
            <div className="p-6">
              {/* Name - Prominent */}
              <div className="mb-6 text-center">
                <p className="text-sm text-slate-500">Participant Name</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{result.name}</p>
              </div>

              {/* Other Details */}
              <div className="space-y-4">
                {result.school && (
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                    <School className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">School</p>
                      <p className="font-medium text-slate-900">{result.school}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                  <Calendar className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Event</p>
                    <p className="font-medium text-slate-900">{result.eventTitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                  <Hash className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Registration ID</p>
                    <p className="font-mono font-medium text-slate-900">{result.registrationId}</p>
                  </div>
                </div>

                {result.category && (
                  <div className="flex items-center gap-3 rounded-xl bg-indigo-50 p-4">
                    <User className="h-5 w-5 text-indigo-400" />
                    <div>
                      <p className="text-xs text-indigo-500">Category</p>
                      <p className="font-medium text-indigo-900">{result.category}</p>
                    </div>
                  </div>
                )}

                {result.position != null && result.position >= 1 && result.position <= 20 && (
                  <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-4">
                    <Award className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-xs text-amber-600">Position</p>
                      <p className="font-bold text-amber-900">{positionLabel(result.position)} Place Winner</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-lg">
            {/* Error Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-8 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                <XCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Not Verified</h2>
              <p className="mt-1 text-red-100">Registration not found</p>
            </div>

            {/* Message */}
            <div className="p-6 text-center">
              <p className="text-slate-600">
                The registration ID <span className="font-mono font-medium text-slate-900">{id}</span> was not found in our database.
              </p>
              <p className="mt-4 text-sm text-slate-500">
                Please check the registration ID and try again, or contact the event organizer.
              </p>
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

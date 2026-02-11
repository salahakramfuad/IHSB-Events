import { adminDb } from '@/lib/firebase-admin'

export type StudentProfilePrefill = {
  displayName: string | null
  school: string | null
  phone: string | null
}

/**
 * Fetches student profile from Firestore for pre-filling forms (e.g. event registration).
 * Returns null if doc does not exist or on error.
 */
export async function getStudentProfileByUid(
  uid: string
): Promise<StudentProfilePrefill | null> {
  if (!adminDb || !uid) return null
  try {
    const doc = await adminDb.collection('students').doc(uid).get()
    if (!doc.exists) return null
    const data = doc.data()
    return {
      displayName: (data?.displayName as string)?.trim() ?? null,
      school: (data?.school as string)?.trim() ?? null,
      phone: (data?.phone as string)?.trim() ?? null,
    }
  } catch {
    return null
  }
}

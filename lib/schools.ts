import { adminDb } from '@/lib/firebase-admin'

/** Ensures a school exists in the schools collection. If not, creates it. */
export async function ensureSchoolExists(schoolName: string): Promise<void> {
  if (!adminDb) return
  const trimmed = schoolName.trim()
  if (!trimmed) return

  const existing = await adminDb
    .collection('schools')
    .where('name', '==', trimmed)
    .limit(1)
    .get()

  if (!existing.empty) return

  await adminDb.collection('schools').add({
    name: trimmed,
    createdAt: new Date(),
  })
}

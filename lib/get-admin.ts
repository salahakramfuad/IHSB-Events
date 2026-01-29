import { adminAuth, adminDb } from '@/lib/firebase-admin'

export type AdminProfile = {
  uid: string
  email: string
  role: 'admin' | 'superAdmin'
  displayName?: string
  photoURL?: string
  updatedAt?: string
}

export async function getCurrentAdminProfile(
  authToken: string | undefined
): Promise<AdminProfile | null> {
  if (!authToken || !adminAuth) return null
  try {
    const decoded = await adminAuth.verifyIdToken(authToken)
    const uid = decoded.uid
    const email = (decoded.email as string) ?? ''
    const role = (decoded.role as 'admin' | 'superAdmin') ?? 'admin'
    if (!uid) return null

    let displayName: string | undefined
    let photoURL: string | undefined
    let updatedAt: string | undefined

    if (adminDb) {
      const doc = await adminDb.collection('admins').doc(uid).get()
      if (doc.exists) {
        const data = doc.data()
        displayName = data?.displayName
        photoURL = data?.photoURL
        const u = data?.updatedAt
        updatedAt = u?.toDate?.()?.toISOString() ?? (typeof u === 'string' ? u : undefined)
      }
    }

    return {
      uid,
      email,
      role,
      displayName,
      photoURL,
      updatedAt,
    }
  } catch {
    return null
  }
}

export async function getAdminList(): Promise<AdminProfile[]> {
  if (!adminDb) return []
  try {
    const snapshot = await adminDb.collection('admins').get()
    const list: AdminProfile[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      const u = data.updatedAt
      list.push({
        uid: doc.id,
        email: data.email ?? '',
        role: (data.role as 'admin' | 'superAdmin') ?? 'admin',
        displayName: data.displayName,
        photoURL: data.photoURL,
        updatedAt: u?.toDate?.()?.toISOString() ?? (typeof u === 'string' ? u : undefined),
      })
    })
    return list.sort((a, b) => (a.email ?? '').localeCompare(b.email ?? ''))
  } catch (error) {
    console.error('getAdminList error:', error)
    return []
  }
}

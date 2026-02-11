import { adminAuth } from '@/lib/firebase-admin'

export type CurrentUser = {
  uid: string
  email: string
  role: string | null
}

export async function getCurrentUser(token: string | undefined): Promise<CurrentUser | null> {
  if (!token || !adminAuth) return null
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    const uid = decoded.uid
    if (!uid) return null
    const email = ((decoded.email as string | undefined) ?? '').toLowerCase()
    const role = (decoded.role as string | undefined) ?? null
    return { uid, email, role }
  } catch {
    return null
  }
}


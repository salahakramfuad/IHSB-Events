import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getAuth, Auth } from 'firebase-admin/auth'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { join } from 'path'

let adminApp: App | undefined
let adminAuth: Auth | undefined
let adminDb: Firestore | undefined

let serviceAccount: {
  projectId: string
  clientEmail: string
  privateKey: string
} | null = null

const hasEnvCredentials =
  process.env.FIREBASE_ADMIN_PRIVATE_KEY &&
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
  process.env.FIREBASE_ADMIN_PROJECT_ID

if (hasEnvCredentials) {
  serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  }
} else {
  try {
    const serviceAccountPath = join(process.cwd(), 'lib', 'firebase-service-account.json')
    const serviceAccountFile = readFileSync(serviceAccountPath, 'utf8')
    const serviceAccountData = JSON.parse(serviceAccountFile)
    serviceAccount = {
      projectId: serviceAccountData.project_id,
      clientEmail: serviceAccountData.client_email,
      privateKey: serviceAccountData.private_key.replace(/\\n/g, '\n'),
    }
  } catch {
    // no credentials
  }
}

if (serviceAccount) {
  try {
    if (getApps().length === 0) {
      adminApp = initializeApp({
        credential: cert({
          projectId: serviceAccount.projectId,
          clientEmail: serviceAccount.clientEmail,
          privateKey: serviceAccount.privateKey,
        }),
      })
    } else {
      adminApp = getApps()[0] as App
    }
    adminAuth = getAuth(adminApp)
    adminDb = getFirestore(adminApp)
  } catch (error) {
    console.error('Firebase Admin initialization error:', error)
  }
}

export { adminAuth, adminDb }
export default adminApp

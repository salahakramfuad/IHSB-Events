import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/lib/get-current-user'
import ProfileForm from './ProfileForm'

export const revalidate = 0

export default async function DashboardProfilePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const user = await getCurrentUser(token)

  if (!user) {
    redirect('/login?redirect=/dashboard/profile')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Profile
        </h1>
        <p className="mt-2 text-slate-600">
          Your account information. Update your name, school, grade, and more.
        </p>
      </header>
      <ProfileForm />
    </div>
  )
}

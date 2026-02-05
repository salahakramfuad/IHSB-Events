import { getCurrentAdminProfileInServer } from '@/app/admin/actions'
import AdminLayoutClient from './AdminLayoutClient'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentAdminProfileInServer()
  return <AdminLayoutClient profile={profile}>{children}</AdminLayoutClient>
}

import { getAdmins } from '@/app/admin/actions'
import AdminsPageClient from './AdminsPageClient'

export default async function AdminAdminsPage() {
  const { list, forbidden } = await getAdmins()
  return <AdminsPageClient admins={list} forbidden={forbidden} />
}

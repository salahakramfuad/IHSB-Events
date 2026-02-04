import { getTrashedEvents, getTrashedRegistrations, getCurrentAdminProfileInServer } from '@/app/admin/actions'
import { notFound } from 'next/navigation'
import TrashPageClient from './TrashPageClient'

export default async function TrashPage() {
  const [trashedEvents, trashedRegistrations, profile] = await Promise.all([
    getTrashedEvents(),
    getTrashedRegistrations(),
    getCurrentAdminProfileInServer(),
  ])

  if (profile?.role !== 'superAdmin') {
    notFound()
  }

  return (
    <TrashPageClient
      trashedEvents={trashedEvents}
      trashedRegistrations={trashedRegistrations}
    />
  )
}

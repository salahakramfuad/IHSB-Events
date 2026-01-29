import Link from 'next/link'
import Image from 'next/image'
import AdminNav from './AdminNav'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200/80 px-5">
          <Image src="/logo.png" alt="IHSB" width={32} height={32} className="rounded-lg object-contain shrink-0" />
          <Link href="/admin" className="text-lg font-bold text-slate-900 truncate">
            IHSB Admin
          </Link>
        </div>
        <div className="flex min-h-0 flex-1 flex-col p-4">
          <AdminNav />
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}

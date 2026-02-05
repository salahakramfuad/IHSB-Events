'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import AdminNav from './AdminNav'
import type { AdminProfile } from '@/lib/get-admin'

interface AdminLayoutClientProps {
  children: React.ReactNode
  profile: AdminProfile | null
}

export default function AdminLayoutClient({
  children,
  profile,
}: AdminLayoutClientProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside
        className={`relative flex shrink-0 flex-col border-r border-slate-200/80 bg-white transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} h-screen sticky top-0`}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:bg-slate-50 hover:text-slate-600"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden />
          ) : (
            <ChevronLeft className="h-4 w-4" aria-hidden />
          )}
        </button>

        <div className="flex h-16 items-center justify-center border-b border-slate-200/80 px-4 shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 min-w-0">
              <Image
                src="/logo.png"
                alt="IHSB"
                width={32}
                height={32}
                className="rounded-lg object-contain shrink-0"
              />
              <Link
                href="/admin"
                className="text-lg font-bold text-slate-900 truncate"
              >
                IHSB Admin
              </Link>
            </div>
          ) : (
            <Image
              src="/logo.png"
              alt="IHSB"
              width={32}
              height={32}
              className="rounded-lg object-contain shrink-0"
            />
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <AdminNav isCollapsed={isCollapsed} profile={profile} />
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}

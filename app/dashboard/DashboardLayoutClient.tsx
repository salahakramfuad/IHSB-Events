'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboard, LogOut, User } from 'lucide-react'

type UserInfo = {
  uid: string
  email: string
  role: string | null
}

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<UserInfo | null>(null)

  useEffect(() => {
    let isMounted = true
    fetch('/api/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.user) setUser(data.user)
      })
      .catch(() => {})
    return () => { isMounted = false }
  }, [])

  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } finally {
      router.push('/login?redirect=/dashboard')
      router.refresh()
    }
  }

  const initial = user?.email?.charAt(0)?.toUpperCase() ?? '?'

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/30">
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-slate-200/80 bg-white shadow-sm">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200/80 px-4">
          <Image
            src="/logo.png"
            alt="IHSB Events"
            width={32}
            height={32}
            className="rounded-lg object-contain"
          />
          <Link
            href="/"
            className="text-lg font-bold text-slate-900 transition hover:text-indigo-600"
          >
            IHSB Events
          </Link>
        </div>

        {/* Profile info */}
        {user && (
          <div className="border-b border-slate-200/80 p-4">
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">Profile</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
            </Link>
          </div>
        )}

        <nav className="flex-1 space-y-1 p-4">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              pathname === '/dashboard'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="h-5 w-5 shrink-0" aria-hidden />
            Dashboard
          </Link>
          <Link
            href="/dashboard/profile"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              pathname === '/dashboard/profile'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <User className="h-5 w-5 shrink-0" aria-hidden />
            Profile
          </Link>
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Events
          </Link>
        </nav>
        <div className="border-t border-slate-200/80 p-4">
          <form onSubmit={handleLogout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-5 w-5 shrink-0" aria-hidden />
              Log out
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  )
}

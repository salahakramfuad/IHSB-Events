'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Calendar, LogOut, User, Users } from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/events', label: 'Events', icon: Calendar },
]

type Profile = { role?: string; email?: string; displayName?: string; photoURL?: string }

export default function AdminNav() {
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setProfile(data)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const displayLabel = profile?.displayName?.trim() || profile?.email?.split('@')[0] || 'Account'
  const hasPhoto = profile?.photoURL?.trim() && (profile.photoURL.startsWith('http') || profile.photoURL.startsWith('/'))

  return (
    <nav className="flex flex-col gap-0.5 min-h-full">
      <div className="flex flex-col gap-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
              pathname === href || (href !== '/admin' && pathname.startsWith(href))
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {label}
          </Link>
        ))}
        <Link
          href="/admin/profile"
          className={clsx(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
            pathname === '/admin/profile'
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          )}
        >
          <User className="h-4 w-4 shrink-0" aria-hidden />
          Profile
        </Link>
        {profile?.role === 'superAdmin' && (
          <Link
            href="/admin/admins"
            className={clsx(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
              pathname.startsWith('/admin/admins')
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            <Users className="h-4 w-4 shrink-0" aria-hidden />
            Admins
          </Link>
        )}
      </div>

      <div className="mt-auto border-t border-slate-200 pt-4">
        {profile && (
          <Link
            href="/admin/profile"
            className="mb-3 flex items-center gap-3 rounded-xl px-3 py-2 text-slate-700 transition hover:bg-slate-100"
          >
            {hasPhoto ? (
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100">
                <Image
                  src={profile.photoURL!}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <User className="h-5 w-5" aria-hidden />
              </div>
            )}
            <span className="min-w-0 truncate text-sm font-medium text-slate-900">
              {displayLabel}
            </span>
          </Link>
        )}
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            Sign out
          </button>
        </form>
      </div>
    </nav>
  )
}

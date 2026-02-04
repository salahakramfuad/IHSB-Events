'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Calendar, LogOut, User, Users, Building2, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/events', label: 'Events', icon: Calendar },
  { href: '/admin/schools', label: 'Schools', icon: Building2 },
]

type Profile = { role?: string; email?: string; displayName?: string; photoURL?: string }

interface AdminNavProps {
  isCollapsed: boolean
}

export default function AdminNav({ isCollapsed }: AdminNavProps) {
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
    <div className="flex flex-col h-full">
      {/* Navigation items - scrollable */}
      <nav className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-0.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              title={isCollapsed ? label : undefined}
              className={clsx(
                'flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isCollapsed ? 'justify-center' : 'gap-3',
                pathname === href || (href !== '/admin' && pathname.startsWith(href))
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              {!isCollapsed && <span>{label}</span>}
            </Link>
          ))}
          <Link
            href="/admin/profile"
            title={isCollapsed ? 'Profile' : undefined}
            className={clsx(
              'flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition',
              isCollapsed ? 'justify-center' : 'gap-3',
              pathname === '/admin/profile'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            <User className="h-5 w-5 shrink-0" aria-hidden />
            {!isCollapsed && <span>Profile</span>}
          </Link>
          {profile?.role === 'superAdmin' && (
            <>
              <Link
                href="/admin/trash"
                title={isCollapsed ? 'Trash' : undefined}
                className={clsx(
                  'flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  isCollapsed ? 'justify-center' : 'gap-3',
                  pathname.startsWith('/admin/trash')
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <Trash2 className="h-5 w-5 shrink-0" aria-hidden />
                {!isCollapsed && <span>Trash</span>}
              </Link>
              <Link
                href="/admin/admins"
              title={isCollapsed ? 'Admins' : undefined}
              className={clsx(
                'flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isCollapsed ? 'justify-center' : 'gap-3',
                pathname.startsWith('/admin/admins')
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Users className="h-5 w-5 shrink-0" aria-hidden />
              {!isCollapsed && <span>Admins</span>}
            </Link>
            </>
          )}
        </div>
      </nav>

      {/* User profile and logout - sticky at bottom */}
      <div className="shrink-0 border-t border-slate-200 bg-white pt-4 mt-4">
        {profile && (
          <Link
            href="/admin/profile"
            title={isCollapsed ? displayLabel : undefined}
            className={clsx(
              'mb-2 flex items-center rounded-xl px-3 py-2 text-slate-700 transition hover:bg-slate-100',
              isCollapsed ? 'justify-center' : 'gap-3'
            )}
          >
            {hasPhoto ? (
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-100">
                <Image
                  src={profile.photoURL!}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              </div>
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <User className="h-4 w-4" aria-hidden />
              </div>
            )}
            {!isCollapsed && (
              <span className="min-w-0 truncate text-sm font-medium text-slate-900">
                {displayLabel}
              </span>
            )}
          </Link>
        )}
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            title={isCollapsed ? 'Sign out' : undefined}
            className={clsx(
              'flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900',
              isCollapsed ? 'justify-center' : 'gap-3'
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden />
            {!isCollapsed && <span>Sign out</span>}
          </button>
        </form>
      </div>
    </div>
  )
}

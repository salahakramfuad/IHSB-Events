'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type CurrentUser = {
  uid: string
  email: string
  role: string | null
}

export default function PublicHeaderNav() {
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined)

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'include' })
        if (!res.ok) {
          if (isMounted) setUser(null)
          return
        }
        const data = await res.json().catch(() => ({}))
        if (isMounted) {
          setUser(data.user ?? null)
        }
      } catch {
        if (isMounted) setUser(null)
      }
    })()
    return () => {
      isMounted = false
    }
  }, [])

  const isAdmin = user && (user.role === 'admin' || user.role === 'superAdmin')

  return (
    <nav className="flex items-center gap-2">
      <Link
        href="/"
        className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-amber-100 hover:text-amber-800"
      >
        Events
      </Link>
      {user === undefined ? null : user ? (
        <>
          <Link
            href="/dashboard"
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
          >
            Dashboard
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 sm:inline-block"
            >
              Admin
            </Link>
          )}
        </>
      ) : (
        <Link
          href="/login?redirect=/dashboard"
          className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
        >
          Sign in
        </Link>
      )}
    </nav>
  )
}


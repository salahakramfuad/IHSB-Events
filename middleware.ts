import { isTokenExpired, getTokenPayload } from '@/lib/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_DURATION_MS = 30 * 60 * 1000

function clearAuthAndRedirect(loginUrl: URL) {
  const response = NextResponse.redirect(loginUrl)
  response.cookies.delete('auth-token')
  response.cookies.delete('user-info')
  response.cookies.delete('session-start')
  return response
}

function isAdminRole(role: string | undefined): boolean {
  return role === 'admin' || role === 'superAdmin'
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth-token')?.value

  const protectedPaths = ['/dashboard', '/admin']
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (isProtected) {
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    const tokenParts = token.split('.')
    if (tokenParts.length !== 3) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return clearAuthAndRedirect(loginUrl)
    }
    if (isTokenExpired(token)) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return clearAuthAndRedirect(loginUrl)
    }
    if (pathname.startsWith('/admin')) {
      const payload = getTokenPayload(token)
      if (!payload || !isAdminRole(payload.role)) {
        return NextResponse.redirect(new URL('/login?message=admin-only', request.url))
      }
      // Only superAdmin can access /admin/admins
      if (pathname.startsWith('/admin/admins') && payload.role !== 'superAdmin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }
    const sessionStartCookie = request.cookies.get('session-start')?.value
    if (sessionStartCookie) {
      const sessionStart = parseInt(sessionStartCookie, 10)
      if (Number.isFinite(sessionStart) && Date.now() - sessionStart > SESSION_DURATION_MS) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return clearAuthAndRedirect(loginUrl)
      }
    }
  }

  if (pathname === '/login' && token) {
    const tokenParts = token.split('.')
    if (tokenParts.length === 3 && !isTokenExpired(token)) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return clearAuthAndRedirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login'],
}

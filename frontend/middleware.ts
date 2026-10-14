import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const { pathname } = request.nextUrl

  // Protected dashboard routes
  const dashboardRoutes = ['/dashboard', '/employees', '/recruitment', '/payroll', '/attendance', '/performance', '/analytics', '/settings']
  const isDashboardRoute = dashboardRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))

  // Verify either a Laravel session or the existing password-login bearer token.
  // Cookie presence alone is never proof of authentication.
  if (isDashboardRoute || pathname === '/login') {
    let authenticated = false
    const backend = (process.env.HRM_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')
    try {
      const headers = new Headers({ Accept: 'application/json', Origin: request.nextUrl.origin })
      const cookies = request.headers.get('cookie')
      if (cookies) headers.set('Cookie', cookies)
      if (token) headers.set('Authorization', `Bearer ${token}`)
      const response = await fetch(`${backend}/api/auth/me`, {
        headers, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(5000),
      })
      authenticated = response.ok
    } catch {
      // A backend outage must not grant access based on a browser token/cookie.
    }
    if (isDashboardRoute && !authenticated) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (pathname === '/login' && authenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - doxa-logo.png (logo file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|doxa-logo.png).*)',
  ],
}

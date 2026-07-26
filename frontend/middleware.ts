import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const { pathname } = request.nextUrl

  // Public routes (no authentication required)
  const publicRoutes = ['/', '/careers', '/careers/jobs', '/careers/jobs/:path*', '/careers/apply/:path*', '/login', '/about']
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route.replace(':path*', '')))

  // Protected dashboard routes
  const dashboardRoutes = ['/dashboard', '/employees', '/recruitment', '/payroll', '/attendance', '/performance', '/analytics', '/settings']
  const isDashboardRoute = dashboardRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))

  // If trying to access dashboard without token, redirect to login
  if (isDashboardRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If trying to access login with token, redirect to dashboard
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
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

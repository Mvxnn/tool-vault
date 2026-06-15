import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const envPassword = process.env.PASSWORD

  // We allow public access if no password is required and we are in development
  if (!envPassword) {
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.next()
    }
  }

  // Check the cookie for authentication
  const authToken = request.cookies.get('auth-token')?.value
  const isAuthenticated = authToken === 'authenticated' || authToken === 'dev-token'

  // If unauthenticated and trying to access protected routes, redirect to /login
  if (!isAuthenticated && envPassword && !request.nextUrl.pathname.startsWith('/login')) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If authenticated and trying to access /login, redirect to /
  if (isAuthenticated && request.nextUrl.pathname.startsWith('/login')) {
    const dashboardUrl = new URL('/', request.url)
    return NextResponse.redirect(dashboardUrl)
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
     * - favicon.ico, sitemap.xml, robots.txt, manifest.webmanifest (metadata files)
     * - android/apple icons
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|icon.png|apple-icon.png).*)',
  ],
}

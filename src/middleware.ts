import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Define which routes are protected
// We exclude public assets, api routes (handled separately usually, or protected here), and the login page
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (login/logout)
     * - login (login page)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public folder)
     */
    '/((?!api/auth|login|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // 1. Allow public access to the home page '/'
  if (path === '/') {
    return NextResponse.next()
  }

  // 2. Check for auth cookie
  const token = request.cookies.get('auth_token')?.value

  if (!token) {
    // If accessing a protected route without token, redirect to login
    const loginUrl = new URL('/login', request.url)
    // loginUrl.searchParams.set('from', path) // Optional: redirect back after login
    return NextResponse.redirect(loginUrl)
  }

  try {
    // 3. Verify JWT
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET_KEY || 'default-secret-key-change-me-in-prod'
    )
    
    await jwtVerify(token, secret)
    
    // Token is valid, allow request
    return NextResponse.next()
  } catch (err) {
    // Token invalid or expired
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
}

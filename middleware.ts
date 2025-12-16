import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Session cookie name (must match lib/middleware.ts)
 */
const SESSION_COOKIE_NAME = "finance_session"

/**
 * Routes that don't require authentication
 */
const publicRoutes = ["/login", "/api/auth/login", "/api/auth/register"]

/**
 * Check if a route is public
 */
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => pathname.startsWith(route))
}

/**
 * Next.js Middleware
 * Protects routes by checking for authentication cookie
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Allow API routes (they handle their own authentication)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Check if user has session cookie
  if (!sessionCookie) {
    // Redirect to login page
    const loginUrl = new URL("/login", request.url)
    // Add the original URL as a redirect parameter
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // User is authenticated, allow access
  return NextResponse.next()
}

/**
 * Configure which routes this middleware runs on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}


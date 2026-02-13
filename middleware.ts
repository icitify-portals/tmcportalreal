import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET
  })

  const path = request.nextUrl.pathname

  // Debug logging
  console.log(`Middleware: ${request.method} ${path}`, { hasToken: !!token })

  // Public routes - allow access
  if (
    path.startsWith("/auth") ||
    path.startsWith("/api/auth") ||
    path === "/"
  ) {
    return NextResponse.next()
  }

  // Protected routes - require authentication
  if (!token) {
    const signInUrl = new URL("/auth/signin", request.url)
    signInUrl.searchParams.set("callbackUrl", path)
    return NextResponse.redirect(signInUrl)
  }

  // Redirect to appropriate dashboard based on role
  if (path === "/" || path === "/dashboard") {
    // Check for SuperAdmin or SYSTEM level role
    const isSuperAdmin = token.isSuperAdmin ||
      token.roles?.some((r) => r.jurisdictionLevel === "SYSTEM")

    if (isSuperAdmin) {
      return NextResponse.redirect(new URL("/dashboard/admin", request.url))
    }
    if (token.officialId) {
      return NextResponse.redirect(new URL("/dashboard/official", request.url))
    }
    if (token.memberId) {
      return NextResponse.redirect(new URL("/dashboard/member", request.url))
    }
    // Default to member dashboard if no specific role
    return NextResponse.redirect(new URL("/dashboard/member", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const session = req.auth
  const path = req.nextUrl.pathname

  // Debug logging
  console.log(`Middleware: ${req.method} ${path}`, { hasToken: !!session })

  // Only protect dashboard routes
  const isDashboardRoute = path.startsWith("/dashboard")

  if (isDashboardRoute && !session) {
    const signInUrl = new URL("/auth/signin", req.url)
    signInUrl.searchParams.set("callbackUrl", path)
    return NextResponse.redirect(signInUrl)
  }

  // Redirect to appropriate dashboard based on role
  if (path === "/dashboard") {
    // Check for SuperAdmin or SYSTEM level role
    const isSuperAdmin = session.user?.isSuperAdmin ||
      (session.user as any)?.roles?.some((r: any) => r.jurisdictionLevel === "SYSTEM")

    if (isSuperAdmin) {
      return NextResponse.redirect(new URL("/dashboard/admin", req.url))
    }
    if ((session.user as any)?.officialId) {
      return NextResponse.redirect(new URL("/dashboard/official", req.url))
    }
    if ((session.user as any)?.memberId) {
      return NextResponse.redirect(new URL("/dashboard/member", req.url))
    }
    // Default to member dashboard if no specific role
    return NextResponse.redirect(new URL("/dashboard/member", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

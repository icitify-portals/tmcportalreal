import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth"

// In NextAuth v5, NextAuth() returns handlers and auth function
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

// Export handlers for GET and POST
export const GET = handlers.GET
export const POST = handlers.POST

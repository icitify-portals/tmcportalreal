import { auth } from "@/app/api/auth/[...nextauth]/route"

/**
 * Get server session - NextAuth v5 compatible
 * 
 * Uses the auth() function exported from the auth route handler
 */
export async function getServerSession() {
  try {
    return await auth()
  } catch (error) {
    console.error("Session error:", error)
    return null
  }
}

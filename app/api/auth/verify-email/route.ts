import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verificationTokens, users } from "@/lib/db/schema"
import { eq, and, gt } from "drizzle-orm"
import { z } from "zod"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get("token")
    const email = searchParams.get("email")

    if (!token || !email) {
      return NextResponse.json({ error: "Missing token or email" }, { status: 400 })
    }

    // Find token using Drizzle - Refactored for compatibility
    const tokens = await db.select()
      .from(verificationTokens)
      .where(and(
        eq(verificationTokens.token, token),
        eq(verificationTokens.identifier, email),
        gt(verificationTokens.expires, new Date())
      ))
      .limit(1)

    const verificationToken = tokens[0]

    if (!verificationToken) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    // Update user to email verified
    await db.update(users)
      .set({ emailVerified: new Date() })
      .where(eq(users.email, email))

    // Delete used token
    await db.delete(verificationTokens)
      .where(and(
        eq(verificationTokens.token, token),
        eq(verificationTokens.identifier, email)
      ))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Verification error:", error)
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    )
  }
}



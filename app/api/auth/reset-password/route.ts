import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, verificationTokens } from "@/lib/db/schema"
import { eq, and, gt } from "drizzle-orm"
import bcrypt from "bcryptjs"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const { email, token, password } = await request.json()

        if (!email || !token || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        if (password.length < 8) {
            return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
        }

        // Verify token
        const storedToken = await db.query.verificationTokens.findFirst({
            where: and(
                eq(verificationTokens.identifier, email),
                eq(verificationTokens.token, token),
                gt(verificationTokens.expires, new Date())
            )
        })

        if (!storedToken) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Update user password
        await db.update(users)
            .set({ password: hashedPassword })
            .where(eq(users.email, email))

        // Delete the used token
        await db.delete(verificationTokens)
            .where(and(
                eq(verificationTokens.identifier, email),
                eq(verificationTokens.token, token)
            ))

        return NextResponse.json({ 
            success: true, 
            message: "Password reset successful. You can now log in with your new password." 
        })
    } catch (error: any) {
        console.error("Reset password error:", error)
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
    }
}

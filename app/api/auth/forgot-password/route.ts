import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, verificationTokens } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { sendEmail, emailTemplates } from "@/lib/email"
import crypto from "crypto"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 })
        }

        // Check if user exists
        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        })

        if (!user) {
            // Return success even if user not found for security (avoid email enumeration)
            return NextResponse.json({ success: true, message: "If an account exists with that email, a reset link has been sent." })
        }

        // Generate reset token
        const token = crypto.randomBytes(32).toString("hex")
        const expires = new Date()
        expires.setHours(expires.getHours() + 1) // 1 hour expiry

        // Delete any existing tokens for this user first to avoid primary key conflicts if any
        // (compound key is identifier + token, so actually not strictly necessary unless we want to limit tokens)
        
        // Store token
        await db.insert(verificationTokens).values({
            identifier: email,
            token: token,
            expires: expires,
        })

        const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`

        // Send email (using a custom template or generic one)
        // Check if there is a password reset template, else use generic
        await sendEmail({
            to: email,
            subject: "Password Reset Request - TMC Portal",
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Password Reset Request</h2>
                    <p>Hello ${user.name || 'User'},</p>
                    <p>You requested a password reset for your TMC Portal account. Click the button below to set a new password:</p>
                    <div style="margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                    </div>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this, you can safely ignore this email.</p>
                    <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eaeaea;" />
                    <p style="font-size: 12px; color: #666;">TMC Portal Team</p>
                </div>
            `,
            text: `Hello, you requested a password reset. Use this link: ${resetUrl}`,
        })

        return NextResponse.json({ 
            success: true, 
            message: "If an account exists with that email, a reset link has been sent." 
        })
    } catch (error: any) {
        console.error("Forgot password error:", error)
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
    }
}

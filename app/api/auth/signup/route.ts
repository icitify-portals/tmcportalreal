import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, verificationTokens } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { sendEmail, emailTemplates } from "@/lib/email"
import { createAuditLog } from "@/lib/audit"
import { z } from "zod"
import crypto from "crypto"

// ... imports remain the same except prisma

// Ensure this is a route handler
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const signupSchema = z.object({
  surname: z.string().min(1, "Surname is required"),
  otherNames: z.string().min(1, "Other names are required"),
  email: z.string().email("Invalid email address"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    const data = signupSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex")
    const verificationExpires = new Date()
    verificationExpires.setHours(verificationExpires.getHours() + 24) // 24 hours

    const userId = crypto.randomUUID()
    const name = `${data.surname} ${data.otherNames}`

    const now = new Date()

    // Create user
    await db.insert(users).values({
      id: userId,
      email: data.email,
      password: hashedPassword,
      name: name,
      phone: data.phone,
      country: data.country,
      address: data.address,
      emailVerified: null,
      createdAt: now,
      updatedAt: now,
    })

    // Store verification token
    await db.insert(verificationTokens).values({
      identifier: data.email,
      token: verificationToken,
      expires: verificationExpires,
    })

    // Send verification email
    const verificationUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(data.email)}`

    console.log("----------------------------------------------------------------")
    console.log("VERIFICATION LINK FOR", data.email, ":")
    console.log(verificationUrl)
    console.log("----------------------------------------------------------------")

    const emailTemplate = emailTemplates.verification(name, verificationUrl)
    await sendEmail({
      to: data.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    })

    await createAuditLog({
      action: "USER_SIGNUP",
      entityType: "User",
      entityId: userId,
      description: `New user signup: ${data.email}`,
    })

    return NextResponse.json({
      success: true,
      message: "Account created. Please check your email to verify your account.",
    }, {
      headers: { "Content-Type": "application/json" }
    })
  } catch (error: any) {
    console.error("Signup error:", error)

    // Always return JSON, never HTML
    return NextResponse.json(
      {
        error: error.message || "Failed to create account",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}


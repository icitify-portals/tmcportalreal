import { Resend } from "resend"
import { db } from "@/lib/db"
import { emailLogs } from "@/lib/db/schema"

const resend = new Resend(process.env.RESEND_API_KEY || "re_123456789")

export interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  template?: string
  templateData?: Record<string, any>
  metadata?: Record<string, any>
  attachments?: {
    filename: string
    content: Buffer | string
  }[]
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const recipients = Array.isArray(options.to) ? options.to : [options.to]
    const from = "TMC Connect <info@messages.tmcng.net>"

    // Use Resend if API key is set, otherwise log (for development)
    if (process.env.RESEND_API_KEY) {
      const result = await resend.emails.send({
        from,
        to: recipients,
        subject: options.subject,
        html: options.html || "",
        text: options.text,
        attachments: options.attachments,
      } as any)

      // Log email to database
      await db.insert(emailLogs).values({
        to: recipients.join(", "),
        from,
        subject: options.subject,
        template: options.template,
        status: result.data ? "SENT" : "FAILED",
        provider: "resend",
        providerId: result.data?.id,
        metadata: options.metadata || {},
        sentAt: result.data ? new Date() : undefined,
        error: result.error ? JSON.stringify(result.error) : undefined,
      })

      if (result.data) {
        return { success: true, messageId: result.data.id }
      } else {
        return { success: false, error: result.error?.message || "Unknown error" }
      }
    } else {
      // Development mode - just log
      console.log("Email (dev mode):", {
        to: recipients,
        subject: options.subject,
        html: options.html,
      })

      await db.insert(emailLogs).values({
        to: recipients.join(", "),
        from,
        subject: options.subject,
        template: options.template,
        status: "SENT",
        provider: "dev",
        metadata: options.metadata || {},
        sentAt: new Date(),
      })

      return { success: true, messageId: "dev-mode" }
    }
  } catch (error: any) {
    console.error("Email send error:", error)

    await db.insert(emailLogs).values({
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      from: "TMC Connect <info@messages.tmcng.net>",
      subject: options.subject,
      template: options.template,
      status: "FAILED",
      error: error.message,
      metadata: options.metadata || {},
    })

    return { success: false, error: error.message }
  }
}

// Email templates
export const emailTemplates = {
  welcome: (name: string, memberId: string) => ({
    subject: "Welcome to Muslim Congress",
    html: `
      <h1>Welcome to Muslim Congress, ${name}!</h1>
      <p>Your membership has been approved. Your member ID is: <strong>${memberId}</strong></p>
      <p>You can now access your member dashboard and enjoy all the benefits of membership.</p>
    `,
  }),
  membershipApproved: (name: string, memberId: string) => ({
    subject: "Membership Approved - Muslim Congress",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #166534;">Membership Approved!</h1>
        <p>Dear ${name},</p>
        <p>We are pleased to inform you that your membership application has been <strong>approved</strong>.</p>
        <p>Your official Member ID is: <strong style="font-size: 18px; color: #166534;">${memberId}</strong></p>
        <p>You can now access your member dashboard and enjoy all the benefits of membership.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background-color: #166534; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Access Dashboard</a>
        </div>
      </div>
    `,
    text: `
      Membership Approved!
      
      Dear ${name},
      
      Your membership application has been approved.
      Your official Member ID is: ${memberId}
      
      Login to your dashboard to view details.
    `,
  }),
  paymentReceived: (name: string, amount: number, description: string) => ({
    subject: "Payment Received - Muslim Congress",
    html: `
      <h1>Payment Received</h1>
      <p>Dear ${name},</p>
      <p>We have received your payment of <strong>₦${amount.toLocaleString()}</strong> for ${description}.</p>
      <p>Thank you for your contribution.</p>
    `,
  }),
  verification: (name: string, verificationUrl: string) => ({
    subject: "Verify Your Email - TMC Connect",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #166534;">Email Verification</h1>
        <p>Dear ${name},</p>
        <p>Thank you for signing up for TMC Connect. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #166534; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
      </div>
    `,
    text: `
      Email Verification
      
      Dear ${name},
      
      Thank you for signing up for TMC Connect. Please verify your email address by visiting this link:
      
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account, please ignore this email.
    `,
  }),
  membershipRejected: (name: string, reason: string) => ({
    subject: "Update on Your Membership Application - Muslim Congress",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #dc2626;">Application Update</h1>
        <p>Dear ${name},</p>
        <p>Thank you for applying for membership with The Muslim Congress.</p>
        <p>We have reviewed your application and unfortunately, we cannot proceed with it at this time due to the following reason:</p>
        <blockquote style="background-color: #fca5a5; padding: 10px; border-left: 4px solid #dc2626; margin: 20px 0;">
          ${reason}
        </blockquote>
        <p>Please log in to your dashboard to review the feedback and update your application details. You can resubmit your application once the necessary changes have been made.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/dashboard/member/apply" style="background-color: #374151; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to Dashboard</a>
        </div>
        <p>If you have any questions, please contact your local branch.</p>
      </div>
    `,
    text: `
      Application Update
      
      Dear ${name},
      
      Your membership application has been reviewed. Unfortunately, we cannot proceed at this time due to the following reason:
      
      ${reason}
      
      Please log in to to your dashboard to fix the issues and resubmit.
    `,
  }),
}


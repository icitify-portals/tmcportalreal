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
  membershipRejected: (name: string, reason: string) => ({
    subject: "Update on Your Membership Application - Muslim Congress",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #dc2626;">Membership Application Status</h1>
        <p>Dear ${name},</p>
        <p>Thank you for your interest in joining Muslim Congress.</p>
        <p>After reviewing your application, we are unable to approve it at this time.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Please log in to your dashboard to make necessary updates or contact your local chapter for assistance.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background-color: #374151; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to Dashboard</a>
        </div>
      </div>
    `,
    text: `
      Membership Update
      
      Dear ${name},
      
      Your membership application was not approved.
      Reason: ${reason}
      
      Please check your dashboard for details.
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
  officerReminder: (name: string, programmeTitle: string, date: string, status: string) => ({
    subject: `Action Required: Upcoming Programme - ${programmeTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #eab308;">Upcoming Programme Reminder</h1>
        <p>Dear ${name},</p>
        <p>This is a reminder that the programme <strong>${programmeTitle}</strong> is scheduled for <strong>${date}</strong>.</p>
        <p>Current Status: <strong>${status}</strong></p>
        <p>Please ensure all necessary arrangements are in place.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/dashboard/programmes" style="background-color: #374151; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Manage Programme</a>
        </div>
      </div>
    `,
    text: `
      Upcoming Programme Reminder
      
      Dear ${name},
      
      This is a reminder that the programme ${programmeTitle} is scheduled for ${date}.
      Current Status: ${status}
      
      Please ensure all necessary arrangements are in place.
    `,
  }),
  weeklyDigest: (name: string, events: { title: string, date: string, venue: string }[]) => ({
    subject: "Events This Week - Muslim Congress",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #166534;">Events This Week</h1>
        <p>Dear ${name},</p>
        <p>Here are the upcoming programmes scheduled for this week:</p>
        <ul style="list-style: none; padding: 0;">
          ${events.map(event => `
            <li style="border-bottom: 1px solid #eee; padding: 15px 0;">
              <h3 style="margin: 0 0 5px 0; color: #166534;">${event.title}</h3>
              <p style="margin: 0; color: #666;">📅 ${event.date} | 📍 ${event.venue}</p>
            </li>
          `).join('')}
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/programmes" style="background-color: #166534; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View All Events</a>
        </div>
      </div>
    `,
    text: `
      Events This Week
      
      Dear ${name},
      
      Here are the upcoming programmes:
      
      ${events.map(e => `- ${e.title} on ${e.date} at ${e.venue}`).join('\n')}
      
      Visit our website for more details.
    `,
  }),
  meetingInvitation: (name: string, title: string, date: string, venue: string, meetingUrl: string) => ({
    subject: `Meeting Invitation: ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #166534;">Meeting Invitation</h1>
        <p>Dear ${name},</p>
        <p>You have been invited to an upcoming meeting:</p>
        <div style="background-color: #f0fdf4; border-left: 4px solid #166534; padding: 15px; margin: 20px 0;">
          <h2 style="margin: 0 0 10px 0; color: #166534;">${title}</h2>
          <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${date}</p>
          <p style="margin: 5px 0;"><strong>📍 Venue:</strong> ${venue}</p>
        </div>
        <p>You can view the meeting details and join the session (if online) through your dashboard:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${meetingUrl}" style="background-color: #166534; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Meeting</a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message from TMC Connect.</p>
      </div>
    `,
    text: `
      Meeting Invitation: ${title}
      
      Dear ${name},
      
      You have been invited to an upcoming meeting:
      
      Title: ${title}
      Date: ${date}
      Venue: ${venue}
      
      View meeting details here: ${meetingUrl}
    `,
  }),
  programmeRegistrationReceipt: (name: string, programmeTitle: string, amount: number, registrationId: string, memberId?: string) => ({
    subject: `Registration Confirmation: ${programmeTitle} - TMC`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
           <h1 style="color: #15803d; margin: 0;">Registration Confirmed</h1>
           <p style="color: #6b7280; margin-top: 4px;">Thank you for registering with The Muslim Congress</p>
        </div>
        
        <p>Dear ${name},</p>
        <p>This is to confirm your successful registration for the upcoming programme:</p>
        
        <div style="background-color: #f0fdf4; border: 1px solid #bcf0da; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <h2 style="margin-top: 0; color: #166534; font-size: 18px;">${programmeTitle}</h2>
          <p style="margin: 4px 0; font-size: 14px; color: #4b5563;"><strong>Amount Paid:</strong> ₦${amount.toLocaleString()}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #4b5563;"><strong>Membership ID:</strong> ${memberId || "Guest"}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #4b5563;"><strong>Registration ID:</strong> ${registrationId}</p>
        </div>
        
        <p><strong>Your Access Slip:</strong></p>
        <p>Please download and print your official access slip, which includes a secure QR code for entry verification at the venue.</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/programmes/registrations/${registrationId}/slip" style="background-color: #15803d; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Download Access Slip</a>
        </div>
        
        <p style="font-size: 13px; color: #6b7280;">If you have any questions, please contact the organizing committee or your local chapter.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="text-align: center; color: #9ca3af; font-size: 11px;">© ${new Date().getFullYear()} The Muslim Congress. All rights reserved.</p>
      </div>
    `,
    text: `
      Registration Confirmation: ${programmeTitle}
      
      Dear ${name},
      
      Your registration for ${programmeTitle} is confirmed.
      Amount Paid: ₦${amount.toLocaleString()}
      Registration ID: ${registrationId}
      
      Download your access slip here: ${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/programmes/registrations/${registrationId}/slip
    `,
  }),
  programmeCertificateThankYou: (name: string, programmeTitle: string, registrationId: string) => ({
    subject: `Thank You for Attending: ${programmeTitle} - Certificate Included`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
           <h1 style="color: #15803d; margin: 0;">Thank You for Coming!</h1>
           <p style="color: #6b7280; margin-top: 4px;">It was a pleasure having you at our programme.</p>
        </div>
        
        <p>Dear ${name},</p>
        <p>We want to express our sincere gratitude for your participation in <strong>${programmeTitle}</strong>. Your presence added great value to the event.</p>
        
        <p>As a token of appreciation and recognition of your participation, your Certificate of Participation is now ready for download.</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/programmes/registrations/${registrationId}/certificate" style="background-color: #15803d; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Download My Certificate</a>
        </div>
        
        <p>We hope to see you at our future programmes. Stay connected with TMC for more impactful engagements.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="text-align: center; color: #9ca3af; font-size: 11px;">© ${new Date().getFullYear()} The Muslim Congress. All rights reserved.</p>
      </div>
    `,
    text: `
      Thank You for Attending: ${programmeTitle}
      
      Dear ${name},
      
      Thank you for participating in ${programmeTitle}. Your certificate is now ready.
      
      Download your certificate here: ${process.env.NEXT_PUBLIC_APP_URL}/api/programmes/registrations/${registrationId}/certificate
      
      Best regards,
      The Muslim Congress
    `,
  }),
}


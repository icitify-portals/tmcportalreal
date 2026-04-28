import { db } from "../lib/db"
import { programmeRegistrations, programmes, members } from "../lib/db/schema"
import { eq, and, or } from "drizzle-orm"
import { sendEmail, emailTemplates } from "../lib/email"

async function resendEmails() {
    console.log("Starting email resend process...")

    try {
        // Fetch all PAID registrations
        // Join with programmes to get titles
        const paidRegistrations = await db.query.programmeRegistrations.findMany({
            where: eq(programmeRegistrations.status, 'PAID'),
            with: {
                programme: true,
                member: true
            }
        })

        console.log(`Found ${paidRegistrations.length} paid registrations.`)

        for (const reg of paidRegistrations) {
            console.log(`Sending email to ${reg.email} (${reg.name}) for ${reg.programme.title}...`)
            
            try {
                await sendEmail({
                    to: reg.email,
                    ...emailTemplates.programmeRegistrationReceipt(
                        reg.name,
                        reg.programme.title,
                        parseFloat(reg.amountPaid || "0"),
                        reg.id,
                        reg.member?.memberId || undefined
                    )
                })
                console.log(`Successfully sent to ${reg.email}`)
            } catch (err) {
                console.error(`Failed to send to ${reg.email}:`, err)
            }
        }

        console.log("Finished resending emails.")
    } catch (error) {
        console.error("Error in resend process:", error)
    }
}

resendEmails().then(() => process.exit(0))

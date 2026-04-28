import { db } from "../lib/db"
import { programmeRegistrations, programmes, members } from "../lib/db/schema"
import { eq, and, or } from "drizzle-orm"
import { sendEmail, emailTemplates } from "../lib/email"

async function resendEmails() {
    console.log("Starting email resend process...")

    try {
        // Fetch all PAID registrations with explicit joins
        const paidRegistrations = await db.select({
            id: programmeRegistrations.id,
            name: programmeRegistrations.name,
            email: programmeRegistrations.email,
            amountPaid: programmeRegistrations.amountPaid,
            programmeTitle: programmes.title,
            memberId: members.memberId
        })
        .from(programmeRegistrations)
        .innerJoin(programmes, eq(programmeRegistrations.programmeId, programmes.id))
        .leftJoin(members, eq(programmeRegistrations.memberId, members.id))
        .where(eq(programmeRegistrations.status, 'PAID'))

        console.log(`Found ${paidRegistrations.length} paid registrations.`)

        for (const reg of paidRegistrations) {
            console.log(`Sending email to ${reg.email} (${reg.name}) for ${reg.programmeTitle}...`)
            
            try {
                await sendEmail({
                    to: reg.email,
                    ...emailTemplates.programmeRegistrationReceipt(
                        reg.name,
                        reg.programmeTitle,
                        parseFloat(reg.amountPaid || "0"),
                        reg.id,
                        reg.memberId || undefined
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

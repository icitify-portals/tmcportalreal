import "dotenv/config"
import { db } from "../lib/db"
import { programmes, programmeRegistrations, users, organizations } from "../lib/db/schema"
import { eq } from "drizzle-orm"
import { sendEmail } from "../lib/email"

async function runTest() {
    const email = "aa.adelopo2@gmail.com"
    console.log(`[Test Flow] Starting test flow for ${email}...`)

    try {
        // 1. Get an organization
        const [org] = await db.select().from(organizations).limit(1)
        if (!org) {
            console.error("No organizations found in database. Please seed first.")
            process.exit(1)
        }

        // 2. Check if user exists, otherwise create
        let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
        if (!user) {
            console.log(`[Test Flow] Creating user for ${email}...`)
            const [newUser] = await db.insert(users).values({
                name: "AA Adelopo",
                email: email,
                emailVerified: new Date(),
                updatedAt: new Date()
            }).$returningId()
            user = { id: newUser.id, name: "AA Adelopo", email: email } as any
        }

        // 3. Create sample test programme
        console.log("[Test Flow] Creating test programme...")
        const [prog] = await db.insert(programmes).values({
            organizationId: org.id,
            title: "Test programme",
            description: "Sample test programme for virtual flow.",
            venue: "Virtual Room",
            startDate: new Date(),
            endDate: new Date(Date.now() + 5 * 60 * 1000), // Ends in 5 minutes
            time: "08:17 AM",
            format: "VIRTUAL",
            meetingUrl: "https://zoom.us/test",
            level: org.level,
            createdBy: user.id,
            updatedAt: new Date()
        }).$returningId()

        // 4. Register the participant
        console.log("[Test Flow] Registering user in the programme...")
        const [reg] = await db.insert(programmeRegistrations).values({
            programmeId: prog.id,
            userId: user.id,
            name: "AA Adelopo",
            email: email,
            status: "REGISTERED",
            updatedAt: new Date()
        }).$returningId()

        // 5. Clock-In
        console.log("[Test Flow] Clocking-in participant...")
        await db.update(programmeRegistrations).set({
            checkInTime: new Date(),
            status: "ATTENDED",
            checkInBy: "TEST_FLOW"
        }).where(eq(programmeRegistrations.id, reg.id))

        // 6. Clock-Out
        console.log("[Test Flow] Clocking-out participant...")
        await db.update(programmeRegistrations).set({
            checkOutTime: new Date(Date.now() + 1000), // Checked out 1 second later
            checkOutBy: "TEST_FLOW"
        }).where(eq(programmeRegistrations.id, reg.id))

        // 7. Send completion message and sample document
        console.log("[Test Flow] Sending completion email...")
        const emailResponse = await sendEmail({
            to: email,
            subject: "Attendance Completion - Test programme",
            html: `
                <h2>Thank You for Attending!</h2>
                <p>Hello ${user.name || "Participant"},</p>
                <p>We are pleased to inform you that your virtual attendance for <strong>Test programme</strong> has been recorded and finalized.</p>
                <p>Attached is a sample document for the programme.</p>
                <p>Best regards,<br/>The Muslim Congress</p>
            `,
            attachments: [
                {
                    filename: "sample-document.txt",
                    content: "This is a sample document for your programme."
                }
            ]
        })

        if (emailResponse.success) {
            console.log("[Test Flow] Test completed successfully! Email sent.")
        } else {
            console.warn(`[Test Flow] Test completed but email was not sent: ${emailResponse.error}`)
        }

    } catch (error) {
        console.error("[Test Flow] Error in test script:", error)
    }
}

runTest().then(() => process.exit(0))

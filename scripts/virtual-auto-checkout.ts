import { db } from "../lib/db"
import { programmes, programmeRegistrations } from "../lib/db/schema"
import { eq, and, isNotNull, isNull, lt } from "drizzle-orm"

async function runAutoCheckout() {
    console.log("[Auto-Checkout] Scanning for virtual attendees to check out...")

    try {
        const now = new Date()

        // 1. Fetch virtual/hybrid programmes that have already ended
        const endedProgrammes = await db.select({
            id: programmes.id,
            endDate: programmes.endDate,
            startDate: programmes.startDate
        })
        .from(programmes)
        .where(
            and(
                isNotNull(programmes.endDate),
                lt(programmes.endDate, now)
            )
        )

        console.log(`[Auto-Checkout] Found ${endedProgrammes.length} programmes that have ended.`)

        let checkoutCount = 0

        for (const prog of endedProgrammes) {
            // Find checked-in attendees without a check-out time
            const attendees = await db.select()
                .from(programmeRegistrations)
                .where(
                    and(
                        eq(programmeRegistrations.programmeId, prog.id),
                        isNotNull(programmeRegistrations.checkInTime),
                        isNull(programmeRegistrations.checkOutTime)
                    )
                )

            for (const attendee of attendees) {
                // Assign a check-out time (either the programme's endDate or 2 hours after check-in if endDate is invalid)
                const checkOutTime = prog.endDate || new Date(attendee.checkInTime!.getTime() + 2 * 60 * 60 * 1000)

                await db.update(programmeRegistrations)
                    .set({
                        checkOutTime: checkOutTime,
                        checkOutBy: "SYSTEM_AUTO_VIRTUAL"
                    })
                    .where(eq(programmeRegistrations.id, attendee.id))

                checkoutCount++
            }
        }

        console.log(`[Auto-Checkout] Successfully checked out ${checkoutCount} virtual attendees.`)
    } catch (error) {
        console.error("[Auto-Checkout] Error running auto-checkout job:", error)
    }
}

runAutoCheckout().then(() => process.exit(0))

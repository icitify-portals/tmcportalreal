import { db } from "../lib/db"
import { programmes, programmeMessages } from "../lib/db/schema"
import { lt, and, eq } from "drizzle-orm"
import { subDays } from "date-fns"

async function cleanup() {
    console.log("Starting programme messaging group cleanup...")
    
    const twoWeeksAgo = subDays(new Date(), 14)
    
    try {
        // Find programmes that ended more than 14 days ago
        const expiredProgrammes = await db.select({ id: programmes.id })
            .from(programmes)
            .where(lt(programmes.endDate, twoWeeksAgo))

        if (expiredProgrammes.length === 0) {
            console.log("No expired programme groups to clean up.")
            return
        }

        const programmeIds = expiredProgrammes.map(p => p.id)
        
        // Delete messages for these programmes
        // Note: With cascade delete on schema, this might happen automatically if we delete the group record, 
        // but we are only deleting the MESSAGES, not the programme itself.
        
        console.log(`Cleaning up messages for ${programmeIds.length} expired programmes...`)
        
        const result = await db.delete(programmeMessages)
            .where(sql`programme_id IN (${programmeIds.join(',')})`) // Simple join for now or use inArray

        console.log("Cleanup completed successfully.")
    } catch (error) {
        console.error("Cleanup failed:", error)
    } finally {
        process.exit(0)
    }
}

// Helper to use inArray logic safely
import { inArray, sql } from "drizzle-orm"

async function cleanupSafe() {
    console.log("Starting safe programme messaging group cleanup...")
    const twoWeeksAgo = subDays(new Date(), 14)
    
    const expiredProgrammes = await db.select({ id: programmes.id })
        .from(programmes)
        .where(lt(programmes.endDate, twoWeeksAgo))

    if (expiredProgrammes.length > 0) {
        const ids = expiredProgrammes.map(p => p.id)
        await db.delete(programmeMessages).where(inArray(programmeMessages.programmeId, ids))
        console.log(`Deleted messages for programmes: ${ids.join(', ')}`)
    } else {
        console.log("No messages to delete.")
    }
    process.exit(0)
}

cleanupSafe()

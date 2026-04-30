import { db } from "@/lib/db"
import { programmeRegistrations, members, users, organizations } from "@/lib/db/schema"
import { eq, isNull, and, sql, or } from "drizzle-orm"

/**
 * Reconcile guest registrations with member records.
 * Matches by Name, State, and LGA.
 */
async function reconcileRegistrations() {
    console.log("Starting reconciliation process...")

    try {
        // 1. Get all guest registrations
        const guestRegs = await db.select()
            .from(programmeRegistrations)
            .where(isNull(programmeRegistrations.memberId))

        console.log(`Found ${guestRegs.length} guest registrations.`)

        let updatedCount = 0

        for (const reg of guestRegs) {
            // 2. Search for a matching member
            // We join users (for name) and organizations (for state/lga)
            const matches = await db.select({
                memberId: members.id,
                userId: users.id,
                membershipId: members.memberId,
                orgName: organizations.name,
                orgState: organizations.state,
                orgLga: organizations.city
            })
            .from(members)
            .innerJoin(users, eq(members.userId, users.id))
            .innerJoin(organizations, eq(members.organizationId, organizations.id))
            .where(and(
                sql`LOWER(TRIM(${users.name})) = LOWER(TRIM(${reg.name}))`,
                or(
                    isNull(sql`${reg.state}`),
                    sql`LOWER(TRIM(${organizations.state})) = LOWER(TRIM(${reg.state}))`
                ),
                or(
                    isNull(sql`${reg.lga}`),
                    sql`LOWER(TRIM(${organizations.city})) = LOWER(TRIM(${reg.lga}))`
                )
            ))
            .limit(2) // Limit to 2 to detect ambiguity

            if (matches.length === 1) {
                const match = matches[0]
                console.log(`Match found for ${reg.name}: Member ${match.membershipId} (${match.orgName})`)

                // 3. Update the registration
                await db.update(programmeRegistrations)
                    .set({
                        memberId: match.memberId,
                        userId: match.userId,
                        branch: match.orgName,
                        // Update state/lga if they were missing in registration but found in member org
                        state: reg.state || match.orgState,
                        lga: reg.lga || match.orgLga
                    })
                    .where(eq(programmeRegistrations.id, reg.id))
                
                updatedCount++
            } else if (matches.length > 1) {
                console.warn(`Ambiguous match for ${reg.name} (found ${matches.length} candidates). Skipping.`)
            } else {
                // No match found
            }
        }

        console.log(`Reconciliation complete. Updated ${updatedCount} registrations.`)
    } catch (error) {
        console.error("Reconciliation error:", error)
    }
}

reconcileRegistrations()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })

import { db } from "../lib/db";
import { programmeRegistrations, members, users } from "../lib/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

async function reconcileGuests() {
    console.log("Starting Guest Reconciliation...");

    // 1. Fetch all guest registrations (userId is null)
    const guests = await db.select()
        .from(programmeRegistrations)
        .where(isNull(programmeRegistrations.userId));

    console.log(`Found ${guests.length} guest registrations.`);

    let matchedCount = 0;

    for (const guest of guests) {
        // 2. Search for a member with matching name, state, and LGA
        // Note: Name matching might be tricky due to formatting, so we use lower case and trim
        const guestName = guest.name.trim().toLowerCase();
        const guestState = guest.state?.trim().toLowerCase();
        const guestLga = guest.lga?.trim().toLowerCase();

        if (!guestState || !guestLga) continue;

        // Find members whose name matches and whose metadata contains matching state/lga
        const memberResults = await db.select({
            memberId: members.id,
            userId: members.userId,
            name: users.name,
            metadata: members.metadata
        })
        .from(members)
        .innerJoin(users, eq(members.userId, users.id))
        .where(sql`LOWER(TRIM(${users.name})) = ${guestName}`);

        for (const member of memberResults) {
            const meta = member.metadata as any;
            const memberState = meta?.state?.trim().toLowerCase();
            const memberLga = meta?.lga?.trim().toLowerCase();

            if (memberState === guestState && memberLga === guestLga) {
                // Match found! Link the registration
                console.log(`Match found for ${guest.name}: ${member.userId}`);
                
                await db.update(programmeRegistrations)
                    .set({
                        userId: member.userId,
                        memberId: member.memberId
                    })
                    .where(eq(programmeRegistrations.id, guest.id));
                
                matchedCount++;
                break;
            }
        }
    }

    console.log(`Reconciliation complete. Matched ${matchedCount} registrations.`);
    process.exit(0);
}

reconcileGuests().catch(err => {
    console.error("Reconciliation failed:", err);
    process.exit(1);
});

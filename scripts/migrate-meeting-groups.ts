import { db } from "@/lib/db";
import { organizations, meetingGroups, meetings, members, officials, meetingGroupMembers } from "@/lib/db/schema";
import { eq, isNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function migrateMeetingGroups() {
    console.log("Starting Meeting Groups Migration...");

    // 1. Fetch all active organizations
    const allOrgs = await db.select().from(organizations);

    // 2. Fetch all meetings without a groupId
    const orphanMeetings = await db.select().from(meetings).where(isNull(meetings.groupId));

    console.log(`Found ${orphanMeetings.length} meetings without a group.`);

    let orgGroupsCreated = 0;
    let meetingsUpdated = 0;

    for (const org of allOrgs) {
        // Find if this org already has meetings without a group
        const orgMeetings = orphanMeetings.filter(m => m.organizationId === org.id);

        if (orgMeetings.length > 0) {
            // Create a General Group for this org
            const groupId = uuidv4();
            await db.insert(meetingGroups).values({
                id: groupId,
                name: "General Members Group",
                description: "Auto-generated group for backward compatibility.",
                organizationId: org.id,
                dynamicRules: {
                    includeAllMembers: true,
                    includeOfficials: true,
                    includeChildAdmins: false
                },
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            orgGroupsCreated++;

            // Update orphan meetings to use this group
            for (const m of orgMeetings) {
                await db.update(meetings)
                    .set({ groupId })
                    .where(eq(meetings.id, m.id));
                meetingsUpdated++;
            }
        }
    }

    console.log(`Migration complete. Created ${orgGroupsCreated} General Groups and updated ${meetingsUpdated} meetings.`);
}

migrateMeetingGroups().catch(console.error).finally(() => process.exit(0));

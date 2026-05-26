import { db } from "@/lib/db";
import { organizations, meetingGroups, meetings, members, officials, meetingGroupMembers } from "@/lib/db/schema";
import { eq, isNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { sql } from "drizzle-orm";

export async function migrateMeetingGroups() {
    console.log("Starting Meeting Groups Migration...");

    try {
        await db.execute(sql`ALTER TABLE meetings ADD COLUMN attendanceWindow int DEFAULT 30;`);
    } catch(e) { console.log("attendanceWindow column might exist"); }

    try {
        await db.execute(sql`ALTER TABLE meetings ADD COLUMN staticAttendanceToken varchar(255);`);
    } catch(e) { console.log("staticAttendanceToken column might exist"); }

    try {
        await db.execute(sql`ALTER TABLE meeting_groups ADD COLUMN dynamicRules json;`);
    } catch(e) { console.log("dynamicRules column might exist"); }

    try {
        await db.execute(sql`ALTER TABLE meeting_attendances ADD COLUMN joinedAt timestamp;`);
    } catch(e) { console.log("joinedAt column might exist"); }

    try {
        await db.execute(sql`ALTER TABLE meeting_attendances ADD COLUMN leftAt timestamp;`);
    } catch(e) { console.log("leftAt column might exist"); }

    try {
        await db.execute(sql`CREATE TABLE IF NOT EXISTS \`programme_messages\` (
          \`id\` varchar(255) NOT NULL,
          \`programmeId\` varchar(255) NOT NULL,
          \`subject\` varchar(255) NOT NULL,
          \`content\` text NOT NULL,
          \`targetAudience\` enum('ALL','PRESENT','ABSENT','ATTENDED','NOT_ATTENDED','PAYMENT_COMPLETED','PAYMENT_PENDING') NOT NULL,
          \`sentBy\` varchar(255) NOT NULL,
          \`sentAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`)
        );`);
    } catch(e) { console.log("programme_messages table error:", e); }

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

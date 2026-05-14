
import { db } from "../lib/db";
import { organizations, officials, users } from "../lib/db/schema";
import { eq, and } from "drizzle-orm";

async function main() {
    // 1. Get National Org
    const [nationalOrg] = await db.select().from(organizations).where(eq(organizations.level, 'NATIONAL')).limit(1);
    console.log('National Org ID:', nationalOrg?.id);

    // 2. Get all officials with user names
    const allOfficials = await db.select({
        id: officials.id,
        position: officials.position,
        orgId: officials.organizationId,
        userName: users.name,
        orgName: organizations.name
    })
    .from(officials)
    .innerJoin(users, eq(officials.userId, users.id))
    .innerJoin(organizations, eq(officials.organizationId, organizations.id));

    console.log('--- Current Officials ---');
    allOfficials.forEach(o => {
        console.log(`${o.userName} - ${o.position} (${o.orgName})`);
    });
}

main().catch(console.error);

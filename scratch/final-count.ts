
import { db } from "../lib/db";
import { officials, organizations, users } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    const results = await db.select({
        name: users.name,
        pos: officials.position
    })
    .from(officials)
    .innerJoin(users, eq(officials.userId, users.id))
    .innerJoin(organizations, eq(officials.organizationId, organizations.id))
    .where(eq(organizations.level, 'NATIONAL'));

    console.log('Total National Officials:', results.length);
    results.forEach(r => console.log(`- ${r.name}: ${r.pos}`));
}

main().catch(console.error);

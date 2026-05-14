
import { db } from "../lib/db";
import { offices, organizations } from "../lib/db/schema";
import { count, eq } from "drizzle-orm";

async function main() {
    const results = await db.select({
        orgName: organizations.name,
        officeCount: count(offices.id)
    })
    .from(offices)
    .innerJoin(organizations, eq(offices.organizationId, organizations.id))
    .groupBy(organizations.name);

    console.log('Offices per Organization:', results);
}

main().catch(console.error);

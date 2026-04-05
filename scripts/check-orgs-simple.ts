import { db } from "../lib/db";
import { organizations } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    const orgs = await db.select().from(organizations);
    console.log(JSON.stringify(orgs.map(o => ({ id: o.id, name: o.name, level: o.level, parentId: o.parentId })), null, 2));
}

main().catch(console.error);

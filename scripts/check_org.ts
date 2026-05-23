import { db } from "../lib/db";
import { organizations } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function run() {
    const orgs = await db.select().from(organizations).where(eq(organizations.id, 'c02137d0-c3c1-445d-9d1a-92c7be200332'));
    console.log("Budget Org Name:", orgs[0]?.name);
    process.exit(0);
}
run().catch(console.error);

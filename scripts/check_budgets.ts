import { db } from "../lib/db";
import { financeBudgets, organizations } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function check() {
    const bs = await db.select().from(financeBudgets);
    const orgs = await db.select().from(organizations);
    console.log("All Organizations:", orgs.map(o => ({ id: o.id, name: o.name })));
    console.log("All Budgets:", bs.map(b => ({ id: b.id, orgId: b.organizationId, title: b.title, status: b.status })));
    process.exit(0);
}
check().catch(console.error);

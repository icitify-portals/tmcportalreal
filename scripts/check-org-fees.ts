import { db } from "../lib/db";
import { fees } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    const orgId = "c02137d0-c3c1-445d-9d1a-92c7be200332";
    const results = await db.select().from(fees).where(eq(fees.organizationId, orgId));
    console.log("Fees found for org:", results.map(r => ({ id: r.id, title: r.title, createdAt: r.createdAt })));
}

main().catch(console.error);

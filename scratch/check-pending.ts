
import { db } from "../lib/db";
import { programmes } from "../lib/db/schema";
import { eq, and, or } from "drizzle-orm";

async function main() {
    const results = await db.select({
        id: programmes.id,
        title: programmes.title,
        status: programmes.status,
        hasCertificate: programmes.hasCertificate
    })
    .from(programmes)
    .where(or(
        eq(programmes.status, 'PENDING_STATE'),
        eq(programmes.status, 'PENDING_NATIONAL')
    ));

    console.log('Pending Programmes:', results);
}

main().catch(console.error);

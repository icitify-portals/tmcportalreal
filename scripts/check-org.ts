
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Checking National Organization...");
    const nationalOrg = await db.query.organizations.findFirst({
        where: eq(organizations.level, "NATIONAL")
    });

    if (!nationalOrg) {
        console.error("❌ National Organization NOT FOUND!");
    } else {
        console.log("✅ National Organization found:");
        console.log({
            id: nationalOrg.id,
            name: nationalOrg.name,
            code: nationalOrg.code,
            paystackSubaccountCode: nationalOrg.paystackSubaccountCode
        });
    }
}

main().catch(console.error);

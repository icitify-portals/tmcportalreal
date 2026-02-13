

import "./env-setup";
import { getUserPermissions } from "@/lib/rbac-v2";
import { db } from "@/lib/db";
import { roles } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Starting RBAC Debug...");
    try {
        // limit to 1 to just check if column exists
        const r = await db.select().from(roles).limit(1);
        console.log("Roles fetch success:", r);

        // Check version
        const [version] = await db.execute(sql`SELECT VERSION() as version`);
        console.log("DB Version:", version);

    } catch (e) {
        console.error("Roles fetch failed:", e);
    }

    try {
        // Try to get permissions for a user (using the ID from the error log if possible, or a random one)
        // The ID in the error was bea3ace2-2b9b-4868-8798-7a8d5e567a29
        const userId = "bea3ace2-2b9b-4868-8798-7a8d5e567a29";
        console.log("Testing getUserPermissions for", userId);
        const perms = await getUserPermissions(userId);
        console.log("Permissions:", JSON.stringify({
            ...perms,
            allPermissions: Array.from(perms.allPermissions),
            jurisdictions: Object.fromEntries(perms.jurisdictions)
        }, null, 2));
    } catch (error) {
        console.error("getUserPermissions failed:");
        console.error(error);
    }
}

main().catch(console.error);

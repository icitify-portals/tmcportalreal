
import 'dotenv/config';
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function checkData() {
    try {
        console.log("Checking database data...");

        const allOrgs = await db.select().from(organizations);
        console.log(`Total Organizations: ${allOrgs.length}`);

        const national = await db.query.organizations.findFirst({
            where: eq(organizations.level, "NATIONAL")
        });

        if (national) {
            console.log("National Org Found:", national.name);
        } else {
            console.log("National Org NOT found.");
        }

    } catch (error) {
        console.error("Check failed:", error);
    }
}

checkData();

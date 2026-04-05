import { db } from "../lib/db";
import { fees } from "../lib/db/schema";
import { sql } from "drizzle-orm";

async function main() {
    try {
        const organizationId = "c02137d0-c3c1-445d-9d1a-92c7be200332";
        
        // Check organization existence
        const [org] = await db.execute(sql`SELECT id, name FROM organizations WHERE id = ${organizationId}`);
        console.log("Organization found:", org);
        
        if (!org) {
            console.error("CRITICAL: Organization does not exist!");
            return;
        }

        console.log("Attempting exact insert...");
        
        const result = await db.insert(fees).values({
            organizationId,
            title: "Annual Dues",
            description: "Annual dues for members",
            amount: "5000",
            targetType: "ALL_MEMBERS",
            dueDate: null,
        });
        
        console.log("Insert successful!");
        console.log("Result:", result);
    } catch (error: any) {
        console.error("DB ERROR DETAILS:");
        console.error(error);
    }
}

main().catch(console.error);

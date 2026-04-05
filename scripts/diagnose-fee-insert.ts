import { db } from "../lib/db";
import { fees } from "../lib/db/schema";
import { v4 as uuidv4 } from "uuid";

async function main() {
    try {
        const organizationId = "c02137d0-c3c1-445d-9d1a-92c7be200332"; // From user's error
        const id = uuidv4();
        
        console.log("Attempting insert with ID:", id);
        
        await db.insert(fees).values({
            id,
            organizationId,
            title: "Test Fee " + id.slice(0, 8),
            description: "Test description",
            amount: "5000",
            targetType: "ALL_MEMBERS",
            dueDate: null,
        });
        
        console.log("Insert successful!");
    } catch (error: any) {
        console.error("DETAILED DB ERROR:");
        console.error("Code:", error.code);
        console.error("Message:", error.message);
        if (error.sqlState) console.error("SQL State:", error.sqlState);
        if (error.sqlMessage) console.error("SQL Message:", error.sqlMessage);
        
        // Also check if organization exists
        const org = await db.query.organizations.findFirst({
            where: (organizations, { eq }) => eq(organizations.id, "c02137d0-c3c1-445d-9d1a-92c7be200332")
        });
        console.log("Organization exists?", !!org);
    }
}

main().catch(console.error);

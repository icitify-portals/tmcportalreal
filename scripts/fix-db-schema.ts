import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
    try {
        console.log("Fixing fees table schema...");
        await db.execute(sql`ALTER TABLE fees MODIFY updatedAt datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`);
        console.log("Fees table fixed!");
    } catch (error: any) {
        console.error("Error fixing table:", error);
    }
}

main().catch(console.error);

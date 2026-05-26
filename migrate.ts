import { db } from "./lib/db";
import { sql } from "drizzle-orm";

async function main() {
    try {
        await db.execute(sql`ALTER TABLE meetings ADD COLUMN targetAudience ENUM('OFFICIALS_ONLY', 'ALL_MEMBERS_JURISDICTION', 'ALL_MEMBERS_GLOBAL') DEFAULT 'ALL_MEMBERS_JURISDICTION'`);
        console.log("Success");
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
main();

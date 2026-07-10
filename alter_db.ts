import { db } from "./lib/db";
import { sql } from "drizzle-orm";

async function main() {
    try {
        await db.execute(sql`ALTER TABLE programmes ADD COLUMN isPublic BOOLEAN DEFAULT TRUE`);
        console.log("Success!");
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
main();

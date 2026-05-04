import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
    try {
        console.log("Altering constitutions table to add documentUrl...");
        // Add documentUrl if it doesn't already exist
        await db.execute(sql`ALTER TABLE constitutions ADD COLUMN IF NOT EXISTS documentUrl TEXT NULL`);
        console.log("Successfully altered constitutions table.");

        console.log("Ensuring programme_reports table has additional fields...");
        try {
            await db.execute(sql`ALTER TABLE programme_reports ADD COLUMN IF NOT EXISTS startTime VARCHAR(255) NULL`);
            await db.execute(sql`ALTER TABLE programme_reports ADD COLUMN IF NOT EXISTS endTime VARCHAR(255) NULL`);
            await db.execute(sql`ALTER TABLE programme_reports ADD COLUMN IF NOT EXISTS lecturers TEXT NULL`);
            await db.execute(sql`ALTER TABLE programme_reports ADD COLUMN IF NOT EXISTS topic TEXT NULL`);
            console.log("Successfully altered programme_reports table.");
        } catch (e: any) {
            console.log("programme_reports alter may have already been run or encountered warning:", e.message);
        }
    } catch (error: any) {
        console.error("Error altering table:", error);
    } finally {
        process.exit(0);
    }
}

main().catch(console.error);

import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
    try {
        console.log("Altering constitutions table to add documentUrl...");
        try {
            await db.execute(sql`ALTER TABLE constitutions ADD COLUMN documentUrl TEXT NULL`);
            console.log("Successfully altered constitutions table.");
        } catch (e: any) {
            console.log("constitutions alter may have already been run or encountered warning:", e.message);
        }

        console.log("Ensuring programme_reports table has additional fields...");
        try {
            await db.execute(sql`ALTER TABLE programme_reports ADD COLUMN startTime VARCHAR(255) NULL`);
        } catch (e: any) {}
        try {
            await db.execute(sql`ALTER TABLE programme_reports ADD COLUMN endTime VARCHAR(255) NULL`);
        } catch (e: any) {}
        try {
            await db.execute(sql`ALTER TABLE programme_reports ADD COLUMN lecturers TEXT NULL`);
        } catch (e: any) {}
        try {
            await db.execute(sql`ALTER TABLE programme_reports ADD COLUMN topic TEXT NULL`);
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

import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
    try {
        console.log("Checking if constitutions table exists and creating if not...");
        try {
            await db.execute(sql`
                CREATE TABLE IF NOT EXISTS constitutions (
                    id VARCHAR(255) NOT NULL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    content TEXT NOT NULL,
                    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
                    documentUrl TEXT NULL,
                    createdBy VARCHAR(255) NOT NULL,
                    createdAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
                    updatedAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);
            console.log("Successfully created/ensured constitutions table.");
        } catch (e: any) {
            console.log("Error or already exists in constitutions create:", e.message);
        }

        console.log("Altering constitutions table to ensure documentUrl exists...");
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

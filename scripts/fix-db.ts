
import "dotenv/config";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function main() {
    try {
        console.log("Attempting to create system_settings table...");

        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS system_settings (
                id varchar(255) PRIMARY KEY,
                settingKey varchar(100) NOT NULL UNIQUE,
                settingValue text,
                category enum('EMAIL', 'NOTIFICATION', 'GENERAL', 'AI') NOT NULL,
                isEncrypted boolean DEFAULT false,
                description varchar(500),
                updatedBy varchar(255),
                updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3)
            );
        `);

        console.log("Success: system_settings table created (or already exists).");
        process.exit(0);
    } catch (error) {
        console.error("Failed to create table:", error);
        process.exit(1);
    }
}

main();

import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
    try {
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS backups (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type ENUM('MANUAL', 'AUTOMATED') DEFAULT 'MANUAL',
                databaseUrl VARCHAR(500),
                filesUrl VARCHAR(500),
                size BIGINT,
                backupStatus ENUM('PENDING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
                error TEXT,
                createdAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
                createdBy VARCHAR(255)
            );
        `);
        console.log("Backups table created successfully.");
    } catch (e) {
        console.error("Error creating backups table", e);
    }
}

main().then(() => process.exit(0)).catch(() => process.exit(1));

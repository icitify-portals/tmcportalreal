import { db } from "../lib/db"
import { sql } from "drizzle-orm"

async function alterDb() {
    console.log("Altering burial_requests table...")

    try {
        await db.execute(sql`
            ALTER TABLE burial_requests
            ADD COLUMN age INT NOT NULL DEFAULT 0,
            ADD COLUMN sex ENUM('MALE', 'FEMALE') NOT NULL DEFAULT 'MALE',
            ADD COLUMN maritalStatus ENUM('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED') NULL,
            ADD COLUMN educationalAttainment ENUM('NONE', 'PRIMARY', 'SECONDARY', 'TERTIARY', 'OTHER') NULL,
            ADD COLUMN occupation VARCHAR(255) NULL,
            ADD COLUMN stateOfOrigin VARCHAR(255) NOT NULL DEFAULT '',
            ADD COLUMN lgaOfOrigin VARCHAR(255) NULL,
            ADD COLUMN proposedBurialDate DATETIME(3) NULL,
            ADD COLUMN burialLocation VARCHAR(255) NULL
        `);
        console.log("Migration successful!")
    } catch (e: any) {
        if (e.message.includes("Duplicate column name")) {
            console.log("Columns already exist, skipping...");
        } else {
            console.error("Migration failed:", e)
        }
    }
}

alterDb().then(() => process.exit(0)).catch(e => {
    console.error(e)
    process.exit(1)
})

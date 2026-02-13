
import "dotenv/config"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

async function createTables() {
    console.log("Creating jurisdiction tables...")

    try {
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS jurisdiction_codes (
                id VARCHAR(255) PRIMARY KEY,
                type ENUM('COUNTRY', 'STATE') NOT NULL,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(255) NOT NULL,
                parentId VARCHAR(255),
                createdAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
                updatedAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                UNIQUE KEY unique_type_code (type, code, parentId)
            );
        `)
        console.log("Created jurisdiction_codes table.")

        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS member_id_sequences (
                \`key\` VARCHAR(255) PRIMARY KEY,
                lastSerial INT NOT NULL DEFAULT 0,
                updatedAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
            );
        `)
        console.log("Created member_id_sequences table.")
        
    } catch (error) {
        console.error("Error creating tables:", error)
        process.exit(1)
    }

    console.log("Tables created successfully.")
    process.exit(0)
}

createTables().catch((err) => {
    console.error(err)
    process.exit(1)
})

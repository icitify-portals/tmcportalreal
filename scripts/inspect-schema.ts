import "dotenv/config"
import { db } from "../lib/db"
import { sql } from "drizzle-orm"

async function checkSchema() {
    console.log("Checking organizations table schema...")
    try {
        const result = await db.execute(sql`DESCRIBE organizations`)
        // Drizzle execute returns different structures depending on driver. 
        // For mysql2/promise, it usually returns [rows, fields].
        // But with Drizzle's execute, it might be just the result object if using the high level API?
        // Let's console log JSON stringified to be sure.
        console.log(JSON.stringify(result, null, 2))
    } catch (e) {
        console.error("Failed to describe table:", e)
    }
    process.exit(0)
}

checkSchema()

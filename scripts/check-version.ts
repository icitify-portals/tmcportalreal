import "dotenv/config"
import { db } from "../lib/db"
import { sql } from "drizzle-orm"

async function checkVersion() {
    try {
        const result = await db.execute(sql`SELECT VERSION() as version`)
        console.log("MySQL Version:", result[0])
    } catch (error) {
        console.error("Failed to fetch version:", error)
    }
    process.exit(0)
}

checkVersion()

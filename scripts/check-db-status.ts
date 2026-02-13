import "dotenv/config"
import { db } from "../lib/db"
import { sql } from "drizzle-orm"

async function check() {
    console.log("Checking DB connection...")
    try {
        const result = await db.execute(sql`SELECT 1`)
        console.log("Connection successful!", result)
        process.exit(0)
    } catch (e) {
        console.error("Connection failed:", e)
        process.exit(1)
    }
}

check()


import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

async function main() {
    try {
        console.log("Fixing invalid dates in fundraising_campaigns...")
        // MySQL might handle 0000-00-00 as NULL or special string depending on mode.
        // We use raw SQL to be sure.
        await db.execute(sql`UPDATE fundraising_campaigns SET updatedAt = createdAt WHERE CAST(updatedAt AS CHAR) LIKE '0000%' OR updatedAt IS NULL`)

        console.log("Fixing invalid dates in organizations...")
        await db.execute(sql`UPDATE organizations SET updatedAt = createdAt WHERE CAST(updatedAt AS CHAR) LIKE '0000%' OR updatedAt IS NULL`)

        console.log("Dates fixed.")
    } catch (e) {
        console.error("Error fixing dates:", e)
    }
    process.exit(0)
}

main()

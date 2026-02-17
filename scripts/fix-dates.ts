
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

const tables = [
    "users", "accounts", "sessions", "organizations", "members", "officials", "roles",
    "permissions", "user_roles", "role_permissions", "payments", "documents",
    "notifications", "posts", "galleries", "messages", "burial_requests",
    "burial_certificates", "pages", "navigation_items", "fundraising_campaigns"
]

async function main() {
    console.log("Starting comprehensive date fix...")
    for (const table of tables) {
        try {
            console.log(`Checking table: ${table}`)
            // Use sql.raw for table name injection (be careful in prod, but this is a controlled script)
            // We check for '0000-00-00' specifically which is often the issue with MySQL strict mode
            await db.execute(sql.raw(`UPDATE \`${table}\` SET updatedAt = createdAt WHERE CAST(updatedAt AS CHAR) LIKE '0000%' OR updatedAt IS NULL`))
            console.log(`Fixed ${table} (if it had issues)`)
        } catch (e: any) {
            // Ignore if column doesn't exist or table doesn't exist
            if (e.message?.includes("Unknown column") || e.message?.includes("doesn't exist")) {
                console.log(`Skipping ${table} (column/table not found)`)
            } else {
                console.error(`Error fixing ${table}:`, e.message)
            }
        }
    }
    console.log("Done.")
    process.exit(0)
}

main()

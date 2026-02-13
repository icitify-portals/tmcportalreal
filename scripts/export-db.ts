import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
dotenv.config()

import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import fs from "fs"
import path from "path"

async function exportData() {
    console.log("Starting database export...")

    // Get all table names (MySQL specific)
    const tables = await db.execute(sql`SHOW TABLES`)
    // @ts-ignore
    const tableNames = tables[0].map((row: any) => Object.values(row)[0])

    const exportData: Record<string, any[]> = {}

    for (const tableName of tableNames) {
        console.log(`Exporting table: ${tableName}...`)
        // safe query? Drizzle doesn't support dynamic table names easily in query builder without raw sql
        try {
            const rows = await db.execute(sql.raw(`SELECT * FROM ${tableName}`))
            // @ts-ignore
            exportData[tableName] = rows[0]
        } catch (e) {
            console.error(`Failed to export ${tableName}:`, e)
        }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `params-export-${timestamp}.json`
    const filepath = path.join(process.cwd(), filename)

    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2))
    console.log(`Export completed! Data saved to: ${filepath}`)
    process.exit(0)
}

exportData().catch((err) => {
    console.error("Export failed:", err)
    process.exit(1)
})

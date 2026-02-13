import fs from "fs"
import path from "path"

// Manually load .env for robustness
try {
    const envPath = path.join(process.cwd(), ".env")
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf-8")
        const match = envContent.match(/DATABASE_URL="?([^"\n]+)"?/)
        if (match && match[1]) {
            process.env.DATABASE_URL = match[1]
            console.log("Loaded DATABASE_URL from .env")
        }
    }
} catch (e) {
    console.error("Failed to load .env manually", e)
}

import { sql } from "drizzle-orm"

async function runMigration() {
    // Dynamic import to ensure env vars are loaded first
    const { db } = await import("@/lib/db")

    console.log("Starting meeting tables migration...")
    console.log("Starting meeting tables migration...")

    try {
        const sqlPath = path.join(process.cwd(), "scripts", "create_meeting_tables.sql")
        const sqlContent = fs.readFileSync(sqlPath, "utf-8")

        // Split by semicolon to get individual statements, filtering out empty ones
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0)

        console.log(`Found ${statements.length} SQL statements to execute.`)

        for (const statement of statements) {
            console.log(`Executing statement: ${statement.substring(0, 50)}...`)
            await db.execute(sql.raw(statement))
        }

        console.log("Migration completed successfully!")
    } catch (error) {
        console.error("Migration failed:", error)
        process.exit(1)
    }
}

runMigration()

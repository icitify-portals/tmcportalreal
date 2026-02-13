import "dotenv/config"
import { createConnection } from "mysql2/promise"

async function main() {
    const url = process.env.DATABASE_URL
    console.log("Connecting to:", url)

    try {
        const connection = await createConnection(url!)
        console.log("Connected.")

        try {
            await connection.execute("ALTER TABLE officials ADD COLUMN image VARCHAR(500)")
            console.log("SUCCESS: Added 'image' column to 'officials' table.")
        } catch (e: any) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("INFO: 'image' column already exists.")
            } else {
                console.error("FAILED to add column:", e)
            }
        }

        const [rows] = await connection.execute("DESCRIBE officials")
        // @ts-ignore
        const imageCol = rows.find(r => r.Field === 'image')
        console.log("Verification - Image Column:", imageCol ? "EXISTS" : "MISSING")

        await connection.end()
    } catch (error) {
        console.error("Database connection error:", error)
    }
}

main()

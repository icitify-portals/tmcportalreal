import "dotenv/config"
import { createConnection } from "mysql2/promise"

async function check() {
    const url = "mysql://root@127.0.0.1:3306/tmc_portal"
    console.log("DATABASE_URL:", url)

    try {
        const connection = await createConnection(process.env.DATABASE_URL!)
        console.log("Connected to database")
        const [rows] = await connection.execute("DESCRIBE officials")
        // @ts-ignore
        const imageCol = rows.find(r => r.Field === 'image')
        if (imageCol) {
            console.log("SUCCESS: 'image' column found in 'officials' table.")
        } else {
            console.log("FAILURE: 'image' column NOT found in 'officials' table.")
        }

        await connection.end()
    } catch (error) {
        console.error("Database error:", error)
    }
}

check()

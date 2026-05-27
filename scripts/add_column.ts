import { db } from "../lib/db"
import { sql } from "drizzle-orm"

async function main() {
    try {
        console.log("Adding programmeId to meetings table...")
        await db.execute(sql`ALTER TABLE meetings ADD COLUMN programmeId varchar(255);`)
        console.log("Success!")
        process.exit(0)
    } catch (e) {
        console.error(e)
        process.exit(1)
    }
}

main()

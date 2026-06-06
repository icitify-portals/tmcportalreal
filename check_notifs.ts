import { db } from './lib/db'
import { notifications } from './lib/db/schema'

async function check() {
    console.log("Checking notifications...")
    const all = await db.query.notifications.findMany({ limit: 10 })
    console.log("Found:", all.length)
    console.log(all)
    process.exit(0)
}
check().catch(console.error)

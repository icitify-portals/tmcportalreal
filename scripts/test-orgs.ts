import { db } from "../lib/db"
import { organizations } from "../lib/db/schema"

async function run() {
    const orgs = await db.select().from(organizations)
    console.log("All orgs:", orgs.map(o => ({ id: o.id, name: o.name, level: o.level, parentId: o.parentId })))
    process.exit(0)
}
run()

import "dotenv/config"
import { db } from "./lib/db"
import { roles } from "./lib/db/schema"

async function main() {
    const allRoles = await db.select().from(roles);
    console.log("Found roles:", allRoles.map(r => ({ name: r.name, code: r.code, active: r.isActive })));
}

main();

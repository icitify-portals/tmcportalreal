import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
    const [result] = await db.execute(sql`DESCRIBE fees`);
    console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);

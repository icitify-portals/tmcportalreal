import { db } from "../lib/db/index.ts";
import { sql } from "drizzle-orm";

async function run() {
    try {
        const res = await db.execute(sql`SELECT 1`);
        console.log("Success:", res);
    } catch (e) {
        console.log("Error:", e.message);
    }
    process.exit(0);
}
run();

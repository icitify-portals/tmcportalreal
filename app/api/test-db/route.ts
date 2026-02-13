
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
    try {
        console.log("Testing DB connection...");
        const result = await db.execute(sql`SELECT 1`);
        return new Response("DB OK", { status: 200 });
    } catch (error) {
        console.error("DB Error:", error);
        return new Response("DB Error: " + error, { status: 500 });
    }
}


import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
    try {
        console.log("1. Testing connection...");
        await db.execute(sql`SELECT 1`);
        console.log("Connection OK.");

        console.log("2. Testing write permissions (create simple table)...");
        await db.execute(sql`CREATE TABLE IF NOT EXISTS test_simple_debug (id int)`);
        console.log("Write OK.");

        console.log("3. Creating system_settings...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS system_settings (
                id varchar(255) PRIMARY KEY,
                settingKey varchar(100) NOT NULL UNIQUE,
                settingValue text,
                category enum('EMAIL', 'NOTIFICATION', 'GENERAL', 'AI') NOT NULL,
                isEncrypted boolean DEFAULT false,
                description varchar(500),
                updatedBy varchar(255),
                updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3)
            );
        `);

        return new Response("Success: system_settings table created.", { status: 200 });
    } catch (error: any) {
        console.error("In-app fix failed:", error);
        return new Response("Error: " + JSON.stringify({ message: error.message, code: error.code, sqlMessage: error.sqlMessage }, null, 2), { status: 500 });
    }
}

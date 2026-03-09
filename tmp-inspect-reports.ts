import { mysqlTable, varchar, text, timestamp, json, mysqlEnum, boolean, int, decimal } from "drizzle-orm/mysql-core";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);

    console.log("Checking columns for 'reports' table...");
    const [columns] = await connection.execute("SHOW COLUMNS FROM reports");
    console.log(JSON.stringify(columns, null, 2));

    await connection.end();
}

main().catch(console.error);

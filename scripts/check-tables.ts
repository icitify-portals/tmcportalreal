
import * as dotenv from "dotenv";
import path from "path";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL is not defined in .env");
        process.exit(1);
    }

    const connection = await mysql.createConnection({
        uri: connectionString
    });

    console.log("Checking tables...");

    try {
        const [rows] = await connection.execute('SHOW TABLES');
        console.log("Tables in DB:", rows);

        try {
            const [postsCols] = await connection.execute('DESCRIBE posts');
            console.log("Posts columns:", postsCols);
        } catch (e) {
            console.log("Could not describe posts table (probably doesn't exist).");
        }

    } catch (error) {
        console.error("Check failed:", error);
    } finally {
        await connection.end();
    }
}

main();

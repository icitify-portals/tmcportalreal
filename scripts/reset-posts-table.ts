
import * as dotenv from "dotenv";
import path from "path";
import mysql from "mysql2/promise";
import { sql } from "drizzle-orm";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
    const connectionString = process.env.DATABASE_URL;
    const connection = await mysql.createConnection({ uri: connectionString });

    try {
        console.log("Dropping incorrect posts table...");
        await connection.execute('DROP TABLE IF EXISTS posts');
        console.log("Dropped.");

        // The migration script will recreate it
    } catch (error) {
        console.error("Drop failed:", error);
    } finally {
        await connection.end();
    }
}

main();

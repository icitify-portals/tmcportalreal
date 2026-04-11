import * as dotenv from "dotenv";
import path from "path";
import mysql from "mysql2/promise";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
    const connection = await mysql.createConnection({ uri: process.env.DATABASE_URL! });

    try {
        console.log("Checking `organizations` schema...");
        const [rows] = await connection.execute("SHOW CREATE TABLE organizations");
        console.log(JSON.stringify(rows, null, 2));
    } catch (error) {
        console.error("Failed:", error);
    } finally {
        await connection.end();
    }
}

main();

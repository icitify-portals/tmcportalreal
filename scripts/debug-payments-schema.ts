
import * as dotenv from "dotenv";
import path from "path";
import mysql from "mysql2/promise";

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

    try {
        console.log("Inspecting 'payments' table columns...");
        const [columns] = await connection.execute("SHOW COLUMNS FROM payments");
        console.log(JSON.stringify(columns, null, 2));

    } catch (error) {
        console.error("Diagnostic failed:", error);
    } finally {
        await connection.end();
    }
}

main();

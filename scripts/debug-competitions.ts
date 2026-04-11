import * as dotenv from "dotenv";
import path from "path";
import mysql from "mysql2/promise";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
    const connectionString = process.env.DATABASE_URL;
    const connection = await mysql.createConnection({ uri: connectionString! });

    try {
        console.log("Checking 'competitions' table...");
        const [columns] = await connection.execute("SHOW COLUMNS FROM competitions");
        console.log(JSON.stringify(columns, null, 2));
    } catch (error: any) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            console.error("Table 'competitions' does not exist.");
        } else {
            console.error("Diagnostic failed:", error.message);
        }
    } finally {
        await connection.end();
    }
}

main();

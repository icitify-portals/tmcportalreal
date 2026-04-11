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
        console.log("Renaming 'status' to 'paymentStatus' in 'payments' table...");
        
        // MySQL 8.0+ syntax
        try {
            await connection.execute("ALTER TABLE payments RENAME COLUMN status TO paymentStatus");
            console.log("Success using RENAME COLUMN");
        } catch (e: any) {
            console.log("RENAME COLUMN failed, trying CHANGE format...");
            // Fallback to older MySQL syntax
            await connection.execute("ALTER TABLE payments CHANGE status paymentStatus enum('PENDING','SUCCESS','FAILED','CANCELLED','REFUNDED') DEFAULT 'PENDING' NOT NULL");
            console.log("Success using CHANGE COLUMN");
        }
        
    } catch (error) {
        console.error("Diagnostic failed:", error);
    } finally {
        await connection.end();
    }
}

main();

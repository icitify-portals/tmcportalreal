import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);

    console.log("Renaming 'reports.type' to 'reports.reportType'...");

    try {
        // Check if 'type' exists
        const [columns]: any = await connection.execute("SHOW COLUMNS FROM reports WHERE Field = 'type'");
        if (columns.length > 0) {
            // Use CHANGE to rename and keep the type/null status
            await connection.execute("ALTER TABLE reports CHANGE COLUMN `type` `reportType` VARCHAR(191) NOT NULL");
            console.log("Renamed successfully.");
        } else {
            console.log("Column 'type' not found. Checking if 'reportType' already exists...");
            const [reportTypeCols]: any = await connection.execute("SHOW COLUMNS FROM reports WHERE Field = 'reportType'");
            if (reportTypeCols.length > 0) {
                console.log("'reportType' already exists. Skipping.");
            } else {
                console.log("Neither 'type' nor 'reportType' found. Table might be missing or structure is different.");
            }
        }
    } catch (err) {
        console.error("Error modifying reports table:", err);
    }

    await connection.end();
}

main().catch(console.error);

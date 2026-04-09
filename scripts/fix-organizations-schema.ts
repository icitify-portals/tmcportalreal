
import * as dotenv from "dotenv";
import path from "path";
import mysql from "mysql2/promise";

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

    console.log("Checking Organizations table schema...");

    try {
        const columnsToAdd = [
            { name: "paystackSubaccountCode", type: "VARCHAR(255)" },
            { name: "bankName", type: "VARCHAR(255)" },
            { name: "accountNumber", type: "VARCHAR(255)" },
            { name: "bankCode", type: "VARCHAR(255)" },
            { name: "planningDeadlineMonth", type: "INT DEFAULT 12" },
            { name: "planningDeadlineDay", type: "INT DEFAULT 12" }
        ];

        for (const col of columnsToAdd) {
            console.log(`Checking for column: ${col.name}...`);
            const [columns] = await connection.execute(
                `SHOW COLUMNS FROM organizations LIKE ?`,
                [col.name]
            );

            if ((columns as any[]).length === 0) {
                console.log(`Adding column: ${col.name}...`);
                await connection.execute(
                    `ALTER TABLE organizations ADD COLUMN ${col.name} ${col.type}`
                );
                console.log(`Column ${col.name} added successfully.`);
            } else {
                console.log(`Column ${col.name} already exists.`);
            }
        }

        console.log("Schema repair completed successfully.");

    } catch (error) {
        console.error("Schema repair failed:", error);
    } finally {
        await connection.end();
    }
}

main();

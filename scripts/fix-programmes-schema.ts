import { mysqlTable, varchar, text, timestamp, boolean, decimal, mysqlEnum, bigint, json, primaryKey, uniqueIndex } from "drizzle-orm/mysql-core";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { sql } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
    if (!DATABASE_URL) {
        console.error("DATABASE_URL is not set");
        process.exit(1);
    }

    const connection = await mysql.createConnection(DATABASE_URL);
    
    console.log("Checking programmes table for rejectionReason column...");
    const [rows] = await connection.execute("SHOW COLUMNS FROM programmes LIKE 'rejectionReason'");
    
    if (Array.isArray(rows) && rows.length === 0) {
        console.log("Column rejectionReason is missing. Adding it...");
        await connection.execute("ALTER TABLE programmes ADD COLUMN rejectionReason TEXT");
        console.log("Column rejectionReason added successfully.");
    } else {
        console.log("Column rejectionReason already exists.");
    }

    // Check for other common missing columns in programmes
    const columnsToCheck = [
        { name: 'isLateSubmission', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'paymentRequired', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'amount', type: 'DECIMAL(10, 2) DEFAULT 0.00' },
        { name: 'hasCertificate', type: 'BOOLEAN DEFAULT FALSE' }
    ];

    for (const col of columnsToCheck) {
        const [res] = await connection.execute(`SHOW COLUMNS FROM programmes LIKE '${col.name}'`);
        if (Array.isArray(res) && res.length === 0) {
            console.log(`Column ${col.name} is missing. Adding it...`);
            await connection.execute(`ALTER TABLE programmes ADD COLUMN ${col.name} ${col.name === 'isLateSubmission' || col.name === 'paymentRequired' || col.name === 'hasCertificate' ? 'TINYINT(1) DEFAULT 0' : col.type}`);
            console.log(`Column ${col.name} added successfully.`);
        }
    }

    console.log("Database schema check completed.");
    await connection.end();
}

main().catch(console.error);

import * as dotenv from "dotenv";
import path from "path";
import mysql from "mysql2/promise";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
    const connection = await mysql.createConnection({ uri: process.env.DATABASE_URL! });

    try {
        console.log("Checking missing columns in programmes...");
        const columnsToAdd = [
            { name: "format", type: "VARCHAR(255) DEFAULT 'PHYSICAL'" },
            { name: "meetingUrl", type: "TEXT" },
            { name: "frequency", type: "VARCHAR(255) DEFAULT 'ONCE'" },
            { name: "rruleString", type: "TEXT" },
            { name: "budget", type: "DECIMAL(10, 2) DEFAULT 0.00" },
            { name: "objectives", type: "TEXT" },
            { name: "committee", type: "TEXT" },
            { name: "attendanceWindow", type: "INT DEFAULT 3" },
            { name: "certTemplateType", type: "VARCHAR(255) DEFAULT 'TMC_ONLY'" },
            { name: "certTmcSignature", type: "TEXT" },
            { name: "certTmcSignatory", type: "VARCHAR(255)" },
            { name: "certPartnerName", type: "VARCHAR(255)" },
            { name: "certPartnerLogo", type: "TEXT" },
            { name: "certPartnerSignature", type: "TEXT" },
            { name: "certPartnerSignatory", type: "VARCHAR(255)" },
            { name: "seriesId", type: "VARCHAR(255)" }
        ];

        for (const col of columnsToAdd) {
            const [rows] = await connection.execute(`SHOW COLUMNS FROM programmes LIKE '${col.name}'`);
            if (Array.isArray(rows) && rows.length === 0) {
                console.log(`Column ${col.name} is missing. Adding it...`);
                await connection.execute(`ALTER TABLE programmes ADD COLUMN ${col.name} ${col.type}`);
                console.log(`Column ${col.name} added successfully.`);
            } else {
                console.log(`Column ${col.name} already exists.`);
            }
        }
    } catch (error) {
        console.error("Failed to alter table:", error);
    } finally {
        await connection.end();
    }
}

main();

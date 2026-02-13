
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

    console.log("Seeding National Organization...");

    try {
        const [rows] = await connection.execute('SELECT id FROM organizations WHERE level = ?', ['NATIONAL']);

        if ((rows as any[]).length === 0) {
            console.log("Creating National Organization...");
            await connection.execute(`
            INSERT INTO organizations (
                id, name, level, code, description, country, email, phone, 
                missionText, visionText, welcomeMessage, createdAt
            ) VALUES (
                UUID(), 
                'The Muslim Congress (National)', 
                'NATIONAL', 
                'TMC-NAT', 
                'The national body of TMC.', 
                'Nigeria', 
                'info@tmcng.net', 
                '+2348000000000',
                '<p>To be the leading Islamic organization...</p>',
                '<p>A society where Islamic values prevail...</p>',
                '<p>Welcome to the national portal.</p>',
                NOW()
            )
         `);
            console.log("National Organization created.");
        } else {
            console.log("National Organization already exists.");
        }

    } catch (error) {
        console.error("Seeding failed:", error);
    } finally {
        await connection.end();
    }
}

main();

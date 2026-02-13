import * as dotenv from "dotenv";
import path from "path";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

// Load .env.local primarily, then fallback to .env
const envLocalPath = path.resolve(process.cwd(), ".env.local");
dotenv.config({ path: envLocalPath });
dotenv.config();

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL is not defined");
        process.exit(1);
    }

    console.log("Applying Paystack & Programmes manual migration...");

    const connection = await mysql.createConnection({
        uri: connectionString
    });

    const db = drizzle(connection);

    try {
        // 1. Update Organizations Table
        console.log("Updating organizations table...");
        const orgColumns = [
            { name: "paystackSubaccountCode", type: "varchar(255)" },
            { name: "bankName", type: "varchar(255)" },
            { name: "accountNumber", type: "varchar(255)" },
            { name: "bankCode", type: "varchar(255)" }
        ];

        for (const col of orgColumns) {
            try {
                await db.execute(sql.raw(`ALTER TABLE organizations ADD COLUMN ${col.name} ${col.type}`));
                console.log(`✅ Added column ${col.name} to organizations`);
            } catch (error: any) {
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log(`ℹ️ Column ${col.name} already exists.`);
                } else {
                    console.error(`❌ Error adding ${col.name}:`, error.message);
                }
            }
        }

        // 2. Create Fees Tables
        console.log("Creating fees and assignments tables...");
        try {
            await db.execute(sql`CREATE TABLE IF NOT EXISTS fees (
                id varchar(255) PRIMARY KEY,
                organizationId varchar(255) NOT NULL,
                title varchar(255) NOT NULL,
                description text,
                amount decimal(10,2) NOT NULL,
                feeTarget enum('ALL_MEMBERS','OFFICIALS') NOT NULL,
                dueDate timestamp(3),
                isActive boolean DEFAULT true,
                createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
                updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
            )`);
            
            await db.execute(sql`CREATE TABLE IF NOT EXISTS fee_assignments (
                id varchar(255) PRIMARY KEY,
                feeId varchar(255) NOT NULL,
                userId varchar(255) NOT NULL,
                status enum('PENDING','PAID') DEFAULT 'PENDING',
                amountPaid decimal(10,2) DEFAULT '0.00',
                paidAt timestamp(3),
                paymentId varchar(255),
                createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
                FOREIGN KEY (feeId) REFERENCES fees(id) ON DELETE CASCADE,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            )`);
            console.log("✅ Fees tables checked/created.");
        } catch (error: any) {
            console.error("❌ Error creating fees tables:", error.message);
        }

        // 3. Create Special Programmes Tables
        console.log("Creating special programmes tables...");
        try {
            await db.execute(sql`CREATE TABLE IF NOT EXISTS special_programmes (
                id varchar(255) PRIMARY KEY,
                organizationId varchar(255) NOT NULL,
                specialProgrammeCategory enum('TESKIYAH_WORKSHOP','FRIDAY_KHUTHBAH','PRESS_RELEASE','STATE_OF_THE_NATION','OTHER') NOT NULL,
                title varchar(255) NOT NULL,
                description text,
                summary text,
                year int NOT NULL,
                date timestamp(3),
                imageUrl varchar(500),
                isPublished boolean DEFAULT true,
                createdBy varchar(255) NOT NULL,
                createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
                updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
                FOREIGN KEY (createdBy) REFERENCES users(id)
            )`);

            await db.execute(sql`CREATE TABLE IF NOT EXISTS special_programme_files (
                id varchar(255) PRIMARY KEY,
                programmeId varchar(255) NOT NULL,
                title varchar(255) NOT NULL,
                url varchar(500) NOT NULL,
                specialProgrammeFileType enum('AUDIO','VIDEO','DOCUMENT','OTHER') NOT NULL,
                \`order\` int DEFAULT 0,
                createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
                FOREIGN KEY (programmeId) REFERENCES special_programmes(id) ON DELETE CASCADE
            )`);
            console.log("✅ Programmes tables checked/created.");
        } catch (error: any) {
            console.error("❌ Error creating programmes tables:", error.message);
        }

        // 4. Create Broadcasts Table
        try {
            await db.execute(sql`CREATE TABLE IF NOT EXISTS broadcasts (
                id varchar(255) PRIMARY KEY,
                senderId varchar(255) NOT NULL,
                title varchar(255) NOT NULL,
                content text NOT NULL,
                media json,
                targetLevel enum('NATIONAL','STATE','LOCAL_GOVERNMENT','BRANCH') NOT NULL,
                targetId varchar(255),
                createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
                updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE
            )`);
            console.log("✅ Broadcasts table checked/created.");
        } catch (error: any) {
             console.error("❌ Error creating broadcasts table:", error.message);
        }

        console.log("🚀 All manual migrations finished.");
    } catch (error: any) {
        console.error("💥 unexpected error:", error);
    } finally {
        await connection.end();
    }
    process.exit(0);
}

main();


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

    console.log("Checking Database Schema...");

    try {
        // 1. Fix Organizations Table
        console.log("\n--- Checking Organizations Table ---");
        const orgColumns = [
            { name: "paystackSubaccountCode", type: "VARCHAR(255)" },
            { name: "bankName", type: "VARCHAR(255)" },
            { name: "accountNumber", type: "VARCHAR(255)" },
            { name: "bankCode", type: "VARCHAR(255)" },
            { name: "planningDeadlineMonth", type: "INT DEFAULT 12" },
            { name: "planningDeadlineDay", type: "INT DEFAULT 12" }
        ];

        for (const col of orgColumns) {
            const [columns] = await connection.execute(
                `SHOW COLUMNS FROM organizations LIKE ?`,
                [col.name]
            );

            if ((columns as any[]).length === 0) {
                console.log(`Adding column: organizations.${col.name}...`);
                await connection.execute(
                    `ALTER TABLE organizations ADD COLUMN ${col.name} ${col.type}`
                );
            }
        }

        // 2. Fix Payments Table
        console.log("\n--- Checking Payments Table ---");
        
        // A. Handle potential rename of 'status' to 'paymentStatus'
        const [statusCols] = await connection.execute("SHOW COLUMNS FROM payments LIKE 'status'");
        const [paymentStatusCols] = await connection.execute("SHOW COLUMNS FROM payments LIKE 'paymentStatus'");
        
        if ((statusCols as any[]).length > 0 && (paymentStatusCols as any[]).length === 0) {
            console.log("Renaming payments.status to payments.paymentStatus...");
            await connection.execute("ALTER TABLE payments CHANGE COLUMN status paymentStatus ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED') DEFAULT 'PENDING'");
        }

        // B. Handle 'type' to 'paymentType' rename if applicable
        const [typeCols] = await connection.execute("SHOW COLUMNS FROM payments LIKE 'type'");
        const [paymentTypeCols] = await connection.execute("SHOW COLUMNS FROM payments LIKE 'paymentType'");
        
        if ((typeCols as any[]).length > 0 && (paymentTypeCols as any[]).length === 0) {
            console.log("Renaming payments.type to payments.paymentType...");
             await connection.execute("ALTER TABLE payments CHANGE COLUMN type paymentType ENUM('MEMBERSHIP_FEE', 'DONATION', 'EVENT_REGISTRATION', 'BURIAL_FEE', 'OTHER') NOT NULL");
        }

        // C. Add other missing columns
        const paymentColumns = [
            { name: "paymentStatus", type: "ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED') DEFAULT 'PENDING'" },
            { name: "paymentType", type: "ENUM('MEMBERSHIP_FEE', 'DONATION', 'EVENT_REGISTRATION', 'BURIAL_FEE', 'OTHER') NOT NULL" },
            { name: "currency", type: "VARCHAR(255) DEFAULT 'NGN'" },
            { name: "campaignId", type: "VARCHAR(255)" }
        ];

        for (const col of paymentColumns) {
             const [cols] = await connection.execute(
                `SHOW COLUMNS FROM payments LIKE ?`,
                [col.name]
            );

            if ((cols as any[]).length === 0) {
                console.log(`Adding column: payments.${col.name}...`);
                await connection.execute(
                    `ALTER TABLE payments ADD COLUMN ${col.name} ${col.type}`
                );
            }
        }

        // 3. Create Burial Requests Table
        console.log("\n--- Checking Burial Requests Table ---");
        const [brTable] = await connection.execute("SHOW TABLES LIKE 'burial_requests'");
        if ((brTable as any[]).length === 0) {
            console.log("Creating 'burial_requests' table...");
            await connection.execute(`
                CREATE TABLE burial_requests (
                    id VARCHAR(255) PRIMARY KEY,
                    userId VARCHAR(255) NOT NULL,
                    deceasedName VARCHAR(255) NOT NULL,
                    relationship VARCHAR(255) NOT NULL,
                    causeOfDeath VARCHAR(255) NOT NULL,
                    dateOfDeath TIMESTAMP(3) NOT NULL,
                    placeOfDeath VARCHAR(255) NOT NULL,
                    contactPhone VARCHAR(255) NOT NULL,
                    contactEmail VARCHAR(255) NOT NULL,
                    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED') DEFAULT 'PENDING',
                    rejectionReason TEXT,
                    paymentId VARCHAR(255),
                    createdAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
                    updatedAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                    UNIQUE KEY burial_requests_payment_unique (paymentId)
                )
            `);
            console.log("'burial_requests' table created.");
        }

        // 4. Create Burial Certificates Table
        console.log("\n--- Checking Burial Certificates Table ---");
        const [bcTable] = await connection.execute("SHOW TABLES LIKE 'burial_certificates'");
        if ((bcTable as any[]).length === 0) {
            console.log("Creating 'burial_certificates' table...");
            await connection.execute(`
                CREATE TABLE burial_certificates (
                    id VARCHAR(255) PRIMARY KEY,
                    burialRequestId VARCHAR(255) NOT NULL,
                    certificateNumber VARCHAR(255) NOT NULL,
                    issuedAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
                    issuedBy VARCHAR(255),
                    pdfUrl VARCHAR(500),
                    createdAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
                    updatedAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                    UNIQUE KEY burial_certificates_request_unique (burialRequestId),
                    UNIQUE KEY burial_certificates_number_unique (certificateNumber)
                )
            `);
            console.log("'burial_certificates' table created.");
        }

        console.log("\nSchema repair completed successfully.");

    } catch (error) {
        console.error("\nSchema repair failed:", error);
    } finally {
        await connection.end();
    }
}

main();

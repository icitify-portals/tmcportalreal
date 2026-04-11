import * as dotenv from "dotenv";
import path from "path";
import mysql from "mysql2/promise";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
    const connection = await mysql.createConnection({ uri: process.env.DATABASE_URL! });

    try {
        console.log("Creating `competitions` table...");
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS competitions (
                id VARCHAR(191) PRIMARY KEY,
                organizationId VARCHAR(191),
                title VARCHAR(191) NOT NULL,
                description TEXT,
                year INT NOT NULL,
                startDate DATETIME(3) NOT NULL,
                endDate DATETIME(3) NOT NULL,
                status ENUM('DRAFT', 'ACTIVE', 'CLOSED', 'COMPLETED') DEFAULT 'ACTIVE',
                fields JSON NOT NULL,
                createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
                updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Success.");

        console.log("Creating `competition_submissions` table...");
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS competition_submissions (
                id VARCHAR(191) PRIMARY KEY,
                competitionId VARCHAR(191) NOT NULL,
                userId VARCHAR(191),
                data JSON NOT NULL,
                status VARCHAR(50) DEFAULT 'SUBMITTED',
                submittedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
                updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                FOREIGN KEY (competitionId) REFERENCES competitions(id) ON DELETE CASCADE,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Success.");

    } catch (error) {
        console.error("Failed to create tables:", error);
    } finally {
        await connection.end();
    }
}

main();

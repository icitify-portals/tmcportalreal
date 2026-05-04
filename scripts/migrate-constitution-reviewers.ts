import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
    try {
        console.log("Creating constitution_reviewers table...");
        try {
            await db.execute(sql`
                CREATE TABLE IF NOT EXISTS constitution_reviewers (
                    id VARCHAR(255) NOT NULL PRIMARY KEY,
                    constitutionId VARCHAR(255) NOT NULL,
                    userId VARCHAR(255) NOT NULL,
                    assignedAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
                    assignedBy VARCHAR(255) NOT NULL,
                    FOREIGN KEY (constitutionId) REFERENCES constitutions(id) ON DELETE CASCADE,
                    FOREIGN KEY (userId) REFERENCES users(id),
                    FOREIGN KEY (assignedBy) REFERENCES users(id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log("constitution_reviewers created.");
        } catch (e: any) {
            console.log("constitution_reviewers may already exist:", e.message?.slice(0, 100));
        }

        console.log("Creating constitution_feedback table...");
        try {
            await db.execute(sql`
                CREATE TABLE IF NOT EXISTS constitution_feedback (
                    id VARCHAR(255) NOT NULL PRIMARY KEY,
                    constitutionId VARCHAR(255) NOT NULL,
                    userId VARCHAR(255) NOT NULL,
                    comment TEXT NOT NULL,
                    section VARCHAR(255) NULL,
                    createdAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
                    FOREIGN KEY (constitutionId) REFERENCES constitutions(id) ON DELETE CASCADE,
                    FOREIGN KEY (userId) REFERENCES users(id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log("constitution_feedback created.");
        } catch (e: any) {
            console.log("constitution_feedback may already exist:", e.message?.slice(0, 100));
        }

        console.log("Done.");
    } catch (error: any) {
        console.error("Error:", error);
    } finally {
        process.exit(0);
    }
}

main().catch(console.error);

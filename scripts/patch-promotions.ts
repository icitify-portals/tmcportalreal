import * as dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function main() {
    console.log("Starting manual patch for Promotion tables...");

    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is not defined in environment variables.");
        process.exit(1);
    }

    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    try {
        // Drop existing tables
        console.log("Dropping existing promotion tables...");
        await connection.execute(`DROP TABLE IF EXISTS promotions`);
        await connection.execute(`DROP TABLE IF EXISTS promotion_plans`);

        // Create promotion_plans table
        console.log("Creating promotion_plans table...");
        await connection.execute(`
            CREATE TABLE promotion_plans (
                id varchar(191) NOT NULL,
                name varchar(191) NOT NULL,
                durationDays int NOT NULL,
                amount decimal(15,2) NOT NULL,
                description text,
                isActive boolean DEFAULT true,
                createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
                updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                CONSTRAINT promotion_plans_id PRIMARY KEY(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Created promotion_plans table.");

        // Create promotions table WITHOUT FKs first
        console.log("Creating promotions table (no FKs)...");
        await connection.execute(`
            CREATE TABLE promotions (
                id varchar(191) NOT NULL,
                userId varchar(191) NOT NULL,
                planId varchar(191) NOT NULL,
                title varchar(191) NOT NULL,
                imageUrl varchar(500) NOT NULL,
                link varchar(500),
                status enum('PENDING','APPROVED','REJECTED','ACTIVE','EXPIRED') DEFAULT 'PENDING',
                paymentStatus enum('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED') DEFAULT 'PENDING',
                amount decimal(15,2) NOT NULL,
                startDate timestamp(3) NULL,
                endDate timestamp(3) NULL,
                approvedBy varchar(191),
                approvedAt timestamp(3) NULL,
                rejectionReason text,
                createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
                updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                CONSTRAINT promotions_id PRIMARY KEY(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Created promotions table (no FKs).");

        // Add FKs one by one
        console.log("Adding FK: userId -> users.id");
        await connection.execute(`
            ALTER TABLE promotions 
            ADD CONSTRAINT promotions_userId_users_id_fk FOREIGN KEY (userId) REFERENCES users(id) ON DELETE cascade;
        `);

        console.log("Adding FK: planId -> promotion_plans.id");
        await connection.execute(`
            ALTER TABLE promotions 
            ADD CONSTRAINT promotions_planId_promotion_plans_id_fk FOREIGN KEY (planId) REFERENCES promotion_plans(id);
        `);

        console.log("Adding FK: approvedBy -> users.id");
        await connection.execute(`
            ALTER TABLE promotions 
            ADD CONSTRAINT promotions_approvedBy_users_id_fk FOREIGN KEY (approvedBy) REFERENCES users(id);
        `);

        console.log("Patch completed successfully.");
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error("Patch failed at step:", error);
        await connection.end();
        process.exit(1);
    }
}

main();

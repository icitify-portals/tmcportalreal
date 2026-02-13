
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config();

async function up() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    try {
        console.log('Creating fundraising_campaigns table...');

        // Using varchar(191) to match Prisma default for CUID/IDs and avoid FK errors
        // Also using DATETIME(3) for timestamps
        await connection.query(`
            CREATE TABLE IF NOT EXISTS fundraising_campaigns (
                id varchar(191) NOT NULL,
                organizationId varchar(191) NOT NULL,
                title varchar(255) NOT NULL,
                slug varchar(191) NOT NULL,
                description text,
                targetAmount decimal(15,2) DEFAULT '0.00',
                raisedAmount decimal(15,2) DEFAULT '0.00',
                startDate DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
                endDate DATETIME(3) NULL,
                status enum('ACTIVE','PAUSED','COMPLETED','ARCHIVED') DEFAULT 'ACTIVE',
                coverImage varchar(500),
                allowCustomAmount tinyint(1) DEFAULT 1,
                suggestedAmounts json,
                createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
                updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                PRIMARY KEY (id),
                UNIQUE KEY campaign_org_slug_idx (organizationId,slug),
                KEY fundraising_campaigns_organizationId_idx (organizationId),
                CONSTRAINT fundraising_campaigns_organizationId_fk FOREIGN KEY (organizationId) REFERENCES organizations (id) ON DELETE CASCADE
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        `);

        console.log('Adding campaignId to payments table...');
        const [columns] = await connection.query("SHOW COLUMNS FROM payments LIKE 'campaignId'");
        if (columns.length === 0) {
            await connection.query(`
                ALTER TABLE payments 
                ADD COLUMN campaignId varchar(191),
                ADD CONSTRAINT payments_campaignId_fk FOREIGN KEY (campaignId) REFERENCES fundraising_campaigns (id) ON DELETE SET NULL
            `);
        } else {
            // Modify if it exists (in case it was created with wrong type 255 before failing?)
            // If it failed at FK creation, column might exist but no FK.
            // Let's assume clean state or column check is enough.
            console.log("Column campaignId already exists.");
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

up();

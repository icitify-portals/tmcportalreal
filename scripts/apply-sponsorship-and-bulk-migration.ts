import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function runMigration() {
    console.log("Applying sponsorship, bulk registration, and early bird migrations...");

    // 1. Create bulk_registration_groups
    console.log("Creating bulk_registration_groups...");
    await db.execute(sql.raw(`
        CREATE TABLE IF NOT EXISTS \`bulk_registration_groups\` (
          \`id\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
          \`programmeId\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
          \`paymasterUserId\` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
          \`paymasterName\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
          \`paymasterEmail\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
          \`paymasterPhone\` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
          \`attendeeCount\` int(11) NOT NULL,
          \`amountPerAttendee\` decimal(10,2) NOT NULL,
          \`totalAmount\` decimal(12,2) NOT NULL,
          \`currency\` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'NGN',
          \`status\` enum('PENDING','PAID','PARTIALLY_PAID','REFUNDED') DEFAULT 'PENDING',
          \`paymentRef\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
          \`paymentId\` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
          \`notes\` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
          \`createdAt\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`updatedAt\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          PRIMARY KEY (\`id\`),
          KEY \`bulk_reg_groups_programme_idx\` (\`programmeId\`),
          CONSTRAINT \`fk_bulk_reg_programme\` FOREIGN KEY (\`programmeId\`) REFERENCES \`programmes\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `));
    console.log("✓ bulk_registration_groups ready.");

    // 2. Create programme_early_bird_tiers
    console.log("Creating programme_early_bird_tiers...");
    await db.execute(sql.raw(`
        CREATE TABLE IF NOT EXISTS \`programme_early_bird_tiers\` (
          \`id\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
          \`programmeId\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
          \`label\` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
          \`startAt\` datetime(3) NULL DEFAULT NULL,
          \`endAt\` datetime(3) NULL DEFAULT NULL,
          \`amount\` decimal(10,2) NOT NULL,
          \`sortOrder\` int(11) DEFAULT 0,
          \`createdAt\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`updatedAt\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          PRIMARY KEY (\`id\`),
          KEY \`programme_eb_tiers_programme_idx\` (\`programmeId\`),
          CONSTRAINT \`fk_eb_tiers_programme\` FOREIGN KEY (\`programmeId\`) REFERENCES \`programmes\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `));
    console.log("✓ programme_early_bird_tiers ready.");

    // 3. Create programme_sponsorship_pools
    console.log("Creating programme_sponsorship_pools...");
    await db.execute(sql.raw(`
        CREATE TABLE IF NOT EXISTS \`programme_sponsorship_pools\` (
          \`id\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
          \`programmeId\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
          \`sponsorUserId\` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
          \`sponsorName\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
          \`sponsorEmail\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
          \`sponsorPhone\` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
          \`seatCount\` int(11) NOT NULL,
          \`seatsClaimed\` int(11) DEFAULT 0,
          \`amountPerSeat\` decimal(10,2) NOT NULL,
          \`totalAmount\` decimal(12,2) NOT NULL,
          \`currency\` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'NGN',
          \`status\` enum('PENDING','PAID','CANCELLED') DEFAULT 'PENDING',
          \`sponsorCode\` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
          \`paymentRef\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
          \`paymentId\` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
          \`notes\` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
          \`createdAt\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`updatedAt\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`programme_sponsor_pool_code_unique\` (\`sponsorCode\`),
          KEY \`programme_sponsor_pool_programme_idx\` (\`programmeId\`),
          CONSTRAINT \`fk_sponsor_pool_programme\` FOREIGN KEY (\`programmeId\`) REFERENCES \`programmes\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `));
    console.log("✓ programme_sponsorship_pools ready.");

    // 4. Add missing columns to programme_registrations
    console.log("Checking columns on programme_registrations...");
    const [cols] = await db.execute(sql.raw("DESCRIBE programme_registrations"));
    const existing = new Set((cols as any[]).map(c => c.Field.toLowerCase()));

    const alterStatements: string[] = [];
    if (!existing.has("lockedamount")) {
        alterStatements.push("ADD COLUMN `lockedAmount` decimal(10,2) NULL");
    }
    if (!existing.has("lockedearlybirddeadline")) {
        alterStatements.push("ADD COLUMN `lockedEarlyBirdDeadline` datetime(3) NULL");
    }
    if (!existing.has("bulkgroupid")) {
        alterStatements.push("ADD COLUMN `bulkGroupId` varchar(191) COLLATE utf8mb4_unicode_ci NULL");
    }
    if (!existing.has("bulkclaimtoken")) {
        alterStatements.push("ADD COLUMN `bulkClaimToken` varchar(100) COLLATE utf8mb4_unicode_ci NULL");
    }
    if (!existing.has("bulkclaimedat")) {
        alterStatements.push("ADD COLUMN `bulkClaimedAt` datetime(3) NULL");
    }
    if (!existing.has("sponsorpoolid")) {
        alterStatements.push("ADD COLUMN `sponsorPoolId` varchar(191) COLLATE utf8mb4_unicode_ci NULL");
    }
    if (!existing.has("is_corporate_registration")) {
        alterStatements.push("ADD COLUMN `is_corporate_registration` tinyint(1) DEFAULT 0");
    }
    if (!existing.has("corporate_entity_name")) {
        alterStatements.push("ADD COLUMN `corporate_entity_name` varchar(255) COLLATE utf8mb4_unicode_ci NULL");
    }
    if (!existing.has("delegation_size")) {
        alterStatements.push("ADD COLUMN `delegation_size` int(11) DEFAULT 1");
    }

    if (alterStatements.length > 0) {
        console.log(`Adding ${alterStatements.length} missing columns to programme_registrations...`);
        await db.execute(sql.raw(`ALTER TABLE \`programme_registrations\` ${alterStatements.join(", ")}`));
        console.log("✓ Columns added successfully.");
    } else {
        console.log("All columns already exist on programme_registrations.");
    }

    console.log("\nAll migrations applied successfully!");
    process.exit(0);
}

runMigration().catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
});

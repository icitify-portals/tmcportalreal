import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function migrateConstitution() {
    console.log("Starting Constitution Migration...");

    try {
        await db.execute(sql`ALTER TABLE constitutions ADD COLUMN branchReviewStartDate timestamp(3) NULL;`);
        await db.execute(sql`ALTER TABLE constitutions ADD COLUMN branchReviewEndDate timestamp(3) NULL;`);
        await db.execute(sql`ALTER TABLE constitutions ADD COLUMN lgaReviewStartDate timestamp(3) NULL;`);
        await db.execute(sql`ALTER TABLE constitutions ADD COLUMN lgaReviewEndDate timestamp(3) NULL;`);
        await db.execute(sql`ALTER TABLE constitutions ADD COLUMN stateReviewStartDate timestamp(3) NULL;`);
        await db.execute(sql`ALTER TABLE constitutions ADD COLUMN stateReviewEndDate timestamp(3) NULL;`);
        await db.execute(sql`ALTER TABLE constitutions ADD COLUMN nationalReviewStartDate timestamp(3) NULL;`);
        await db.execute(sql`ALTER TABLE constitutions ADD COLUMN nationalReviewEndDate timestamp(3) NULL;`);
    } catch(e) { console.log("Constitutions columns might exist", e); }

    try {
        await db.execute(sql`ALTER TABLE constitution_feedback ADD COLUMN level enum('MEMBER', 'LGA_COLLATION', 'STATE_COLLATION', 'NATIONAL_COLLATION') DEFAULT 'MEMBER';`);
        await db.execute(sql`ALTER TABLE constitution_feedback ADD COLUMN memberId varchar(255) NULL;`);
        await db.execute(sql`ALTER TABLE constitution_feedback ADD COLUMN jurisdictionBranchId varchar(255) NULL;`);
        await db.execute(sql`ALTER TABLE constitution_feedback ADD COLUMN jurisdictionLgaId varchar(255) NULL;`);
        await db.execute(sql`ALTER TABLE constitution_feedback ADD COLUMN jurisdictionStateId varchar(255) NULL;`);
    } catch(e) { console.log("Constitution Feedback columns might exist", e); }

    console.log(`Migration complete.`);
}

migrateConstitution().catch(console.error).finally(() => process.exit(0));

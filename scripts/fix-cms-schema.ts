import "dotenv/config"
import { db } from "../lib/db"
import { sql } from "drizzle-orm"

async function runFix() {
    console.log("Applying CMS Schema fixes...")

    // 1. Add Columns to Organizations
    const columns = [
        "ADD COLUMN `welcomeMessage` text",
        "ADD COLUMN `welcomeImageUrl` varchar(500)",
        "ADD COLUMN `googleMapUrl` text",
        "ADD COLUMN `socialLinks` json"
    ]

    for (const col of columns) {
        try {
            await db.execute(sql.raw(`ALTER TABLE \`organizations\` ${col}`))
            console.log(`Executed: ${col}`)
        } catch (e: any) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log(`Column already exists: ${col}`)
            } else {
                console.error(`Failed to add column: ${col}`, e.message)
            }
        }
    }

    // 2. Create Galleries Table
    try {
        await db.execute(sql.raw(`
            CREATE TABLE IF NOT EXISTS \`galleries\` (
                \`id\` varchar(255) NOT NULL,
                \`organizationId\` varchar(255) NOT NULL,
                \`title\` varchar(255) NOT NULL,
                \`description\` text,
                \`isActive\` boolean DEFAULT true,
                \`createdAt\` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
                \`updatedAt\` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT \`galleries_id\` PRIMARY KEY(\`id\`)
            );
        `))
        console.log("Created galleries table")
    } catch (e: any) {
        console.error("Failed to create galleries table", e.message)
    }

    // 3. Create Gallery Images Table
    try {
        await db.execute(sql.raw(`
            CREATE TABLE IF NOT EXISTS \`gallery_images\` (
                \`id\` varchar(255) NOT NULL,
                \`galleryId\` varchar(255) NOT NULL,
                \`imageUrl\` varchar(500) NOT NULL,
                \`caption\` varchar(255),
                \`order\` int DEFAULT 0,
                \`createdAt\` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
                CONSTRAINT \`gallery_images_id\` PRIMARY KEY(\`id\`)
            );
        `))
        console.log("Created gallery_images table")
    } catch (e: any) {
        console.error("Failed to create gallery_images table", e.message)
    }

    // 4. Add constraints
    // Try adding constraint, ignore if exists (ER_DUP_KEY or similar)
    try {
        await db.execute(sql.raw(`ALTER TABLE \`galleries\` ADD CONSTRAINT \`galleries_organizationId_organizations_id_fk\` FOREIGN KEY (\`organizationId\`) REFERENCES \`organizations\`(\`id\`) ON DELETE cascade ON UPDATE no action`))
        console.log("Added FK to galleries")
    } catch (e: any) {
        console.log("FK galleries_organizationId... might already exist or failed", e.message)
    }

    try {
        await db.execute(sql.raw(`ALTER TABLE \`gallery_images\` ADD CONSTRAINT \`gallery_images_galleryId_galleries_id_fk\` FOREIGN KEY (\`galleryId\`) REFERENCES \`galleries\`(\`id\`) ON DELETE cascade ON UPDATE no action`))
        console.log("Added FK to gallery_images")
    } catch (e: any) {
        console.log("FK gallery_images_galleryId... might already exist or failed", e.message)
    }

    console.log("Fixes applied.")
    process.exit(0)
}

runFix()

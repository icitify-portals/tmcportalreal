import * as dotenv from "dotenv";
import path from "path";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

// Load .env from project root
const envPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL is not defined in .env");
        process.exit(1);
    }

    console.log("Applying manual migration...");

    // Create a dedicated connection for this script
    const connection = await mysql.createConnection({
        uri: connectionString
    });

    const db = drizzle(connection);

    try {
        // 1. Add CMS columns to organizations
        try {
            console.log("Adding CMS columns...");
            await db.execute(sql`ALTER TABLE organizations ADD COLUMN missionText text`);
            await db.execute(sql`ALTER TABLE organizations ADD COLUMN visionText text`);
            await db.execute(sql`ALTER TABLE organizations ADD COLUMN whatsapp varchar(255)`);
            await db.execute(sql`ALTER TABLE organizations ADD COLUMN officeHours varchar(255)`);
            await db.execute(sql`ALTER TABLE organizations ADD COLUMN sliderImages json`);
        } catch (error: any) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log("CMS columns already exist, skipping.");
            } else {
                console.error("Error adding CMS columns:", error.message);
            }
        }

        // 2. Create Tables (Chats, Notifications, Posts)
        try {
            console.log("Creating tables...");

            // Chats
            await db.execute(sql`CREATE TABLE IF NOT EXISTS chats (
      id varchar(255) PRIMARY KEY,
      name varchar(255),
      isGroup boolean DEFAULT false,
      createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    )`);

            await db.execute(sql`CREATE TABLE IF NOT EXISTS chat_participants (
      id varchar(255) PRIMARY KEY,
      chatId varchar(255) NOT NULL,
      userId varchar(255) NOT NULL,
      joinedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
      FOREIGN KEY (chatId) REFERENCES chats(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )`);

            await db.execute(sql`CREATE TABLE IF NOT EXISTS messages (
      id varchar(255) PRIMARY KEY,
      chatId varchar(255) NOT NULL,
      senderId varchar(255) NOT NULL,
      content text NOT NULL,
      isRead boolean DEFAULT false,
      metadata json,
      createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      FOREIGN KEY (chatId) REFERENCES chats(id) ON DELETE CASCADE,
      FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE
    )`);

            // Notifications
            await db.execute(sql`CREATE TABLE IF NOT EXISTS notifications (
      id varchar(255) PRIMARY KEY,
      userId varchar(255) NOT NULL,
      title varchar(255) NOT NULL,
      message text NOT NULL,
      type enum('INFO','SUCCESS','WARNING','ERROR') DEFAULT 'INFO',
      isRead boolean DEFAULT false,
      actionUrl varchar(500),
      metadata json,
      createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )`);

            // Posts
            await db.execute(sql`CREATE TABLE IF NOT EXISTS posts (
      id varchar(255) PRIMARY KEY,
      organizationId varchar(255) NOT NULL,
      authorId varchar(255) NOT NULL,
      title varchar(255) NOT NULL,
      slug varchar(255) NOT NULL UNIQUE,
      excerpt text,
      content text NOT NULL,
      coverImage varchar(500),
      postType enum('NEWS','EVENT','ANNOUNCEMENT') DEFAULT 'NEWS',
      isPublished boolean DEFAULT false,
      publishedAt timestamp(3),
      createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (authorId) REFERENCES users(id)
    )`);

            console.log("Tables created successfully.");
        } catch (error: any) {
            console.error("Error creating tables:", error);
        }

        console.log("Migration applied successfully.");
    } catch (error: any) {
        console.error("An unexpected error occurred during migration:", error);
    } finally {
        await connection.end();
    }
    process.exit(0);
}

main();

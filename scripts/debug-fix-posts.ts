
import * as dotenv from "dotenv";
import path from "path";
import mysql from "mysql2/promise";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL is not defined");
        return;
    }

    const connection = await mysql.createConnection({ uri: connectionString });

    try {
        console.log("--- DEBUGGING ---");

        // 1. Check Users ID
        const [usersCols] = await connection.execute("SHOW FULL COLUMNS FROM users WHERE Field = 'id'");
        console.log("Users ID:", usersCols);

        // 2. Check Organizations ID
        const [orgCols] = await connection.execute("SHOW FULL COLUMNS FROM organizations WHERE Field = 'id'");
        console.log("Orgs ID:", orgCols);

        // 3. Drop Posts
        console.log("Dropping posts table...");
        await connection.execute("DROP TABLE IF EXISTS posts");
        console.log("Dropped posts table.");

        // 4. Create Posts Table (Fixed Definition)
        // explicitly using varchar(191) to match referenced columns
        console.log("Attempting to create posts table...");
        const createSQL = `
        CREATE TABLE posts (
          id varchar(191) PRIMARY KEY,
          organizationId varchar(191) NOT NULL,
          authorId varchar(191) NOT NULL,
          title varchar(255) NOT NULL,
          slug varchar(191) NOT NULL UNIQUE,
          excerpt text,
          content text NOT NULL,
          coverImage varchar(500),
          postType enum('NEWS','EVENT','ANNOUNCEMENT') DEFAULT 'NEWS',
          isPublished boolean DEFAULT false,
          publishedAt timestamp(3) NULL,
          createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
          updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          CONSTRAINT fk_posts_org FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
          CONSTRAINT fk_posts_author FOREIGN KEY (authorId) REFERENCES users(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
     `;

        await connection.execute(createSQL);
        console.log("SUCCESS: Posts table created with correct schema.");

    } catch (error: any) {
        console.error("FAILURE:", error.message);
        if (error.sqlMessage) console.error("SQL Message:", error.sqlMessage);
    } finally {
        await connection.end();
    }
}

main();

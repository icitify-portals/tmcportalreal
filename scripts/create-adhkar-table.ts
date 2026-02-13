
import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Creating adhkar_centres table...");

    await db.execute(sql`
    CREATE TABLE IF NOT EXISTS adhkar_centres (
        id varchar(255) NOT NULL,
        name varchar(255) NOT NULL,
        venue varchar(255) NOT NULL,
        address text NOT NULL,
        time varchar(255) NOT NULL,
        contactNumber varchar(255),
        state varchar(255) NOT NULL,
        lga varchar(255) NOT NULL,
        organizationId varchar(255),
        isActive boolean DEFAULT true,
        createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id)
    );
  `);

    console.log("Table created successfully.");
    process.exit(0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

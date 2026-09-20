import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function main() {
    try {
        console.log("Adding isLocked to meetings...");
        await db.execute(sql`ALTER TABLE meetings ADD COLUMN isLocked BOOLEAN DEFAULT false;`);
        console.log("Success!");
    } catch (e: any) {
        if (e.message.includes("Duplicate column name")) {
            console.log("Column already exists.");
        } else {
            console.error("Error:", e);
        }
    }
    process.exit(0);
}

main();

import { db } from '../lib/db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';

const statements = [
    "ALTER TABLE `meetings` DROP INDEX `meetings_shareCode_unique`;",
    "ALTER TABLE `meetings` DROP INDEX `meetings_recordingShareCode_unique`;",
    "ALTER TABLE `meetings` ADD `seriesId` varchar(255);",
    "ALTER TABLE `meetings` ADD `frequency` enum('ONCE','WEEKLY','BI_WEEKLY','MONTHLY') DEFAULT 'ONCE';"
];

async function run() {
    for (const stmt of statements) {
        const query = stmt.trim();
        if (query) {
            console.log('Executing:', query);
            await db.execute(sql.raw(query));
        }
    }
}

run().then(() => {
    console.log("Migration complete");
    process.exit(0);
}).catch(err => {
    console.error("Migration error:", err);
    process.exit(1);
});

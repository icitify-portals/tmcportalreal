import { db } from './lib/db';
import { sql } from 'drizzle-orm';

async function run() {
    try {
        await db.execute(sql`ALTER TABLE programmes ADD COLUMN seriesId VARCHAR(255);`);
        console.log('done');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();

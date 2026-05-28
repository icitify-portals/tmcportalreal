import { db, sql } from '../lib/db';
import * as fs from 'fs';

const migration = fs.readFileSync('./drizzle/0002_shiny_the_spike.sql', 'utf8');
const statements = migration.split('--> statement-breakpoint');

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

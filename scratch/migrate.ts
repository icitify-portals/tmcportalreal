import { db } from '../lib/db'
import { sql } from 'drizzle-orm'

async function migrate() {
  try {
    await db.execute(sql`ALTER TABLE \`officials\` ADD \`officeId\` varchar(255);`);
    console.log('Added officeId to officials');
  } catch (e) { console.log('officeId already exists or error', e?.message); }

  try {
    await db.execute(sql`ALTER TABLE \`officials\` ADD CONSTRAINT \`officials_officeId_offices_id_fk\` FOREIGN KEY (\`officeId\`) REFERENCES \`offices\`(\`id\`) ON DELETE no action ON UPDATE no action;`);
    console.log('Added FK to officials');
  } catch (e) { console.log('FK already exists or error', e?.message); }

  try {
    await db.execute(sql`ALTER TABLE \`offices\` ADD \`managedSpecialCategories\` json;`);
    console.log('Added managedSpecialCategories to offices');
  } catch (e) { console.log('managedSpecialCategories already exists or error', e?.message); }

  console.log('Migration complete');
  process.exit(0);
}

migrate();

import { db } from '../lib/db';
import { backups } from '../lib/db/schema';
import { desc } from 'drizzle-orm';
async function run() {
  const list = await db.select().from(backups).orderBy(desc(backups.createdAt)).limit(10);
  console.log(JSON.stringify(list, null, 2));
  process.exit(0);
}
run();

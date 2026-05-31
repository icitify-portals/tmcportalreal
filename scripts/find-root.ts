import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function run() {
  const result = await db.execute(sql`SELECT id FROM organizations WHERE level = 'NATIONAL' LIMIT 1`);
  console.log(result[0]);
}

run().catch(console.error).finally(() => process.exit(0));

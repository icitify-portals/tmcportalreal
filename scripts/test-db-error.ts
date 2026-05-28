import { db } from '../lib/db';
import { sql } from 'drizzle-orm';
async function run() {
  try {
    await db.execute(sql`insert into \`system_settings\` (\`id\`, \`settingKey\`, \`settingValue\`, \`category\`, \`updatedBy\`) values ('test-id-123', 'test-key-123', 'test-val', 'INTEGRATION', 'test-user')`);
    console.log("SUCCESS");
    await db.execute(sql`delete from \`system_settings\` where \`id\` = 'test-id-123'`);
  } catch (e: any) {
    console.log("SQL_ERROR_MESSAGE:", e.sqlMessage);
    console.log("SQL_ERROR_CODE:", e.code);
  }
  process.exit(0);
}
run();

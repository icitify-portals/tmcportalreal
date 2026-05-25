import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql.raw('ALTER TABLE burial_requests MODIFY updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);'));
  console.log('Fixed burial_requests');
  await db.execute(sql.raw('ALTER TABLE occasion_requests MODIFY updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);'));
  console.log('Fixed occasion_requests');
  await db.execute(sql.raw('ALTER TABLE broadcasts MODIFY updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);'));
  console.log('Fixed broadcasts');
  process.exit(0);
}
main().catch(console.error);

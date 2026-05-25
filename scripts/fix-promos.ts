import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql.raw('ALTER TABLE promotions MODIFY updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);'));
  console.log('Fixed promotions');
  await db.execute(sql.raw('ALTER TABLE promotion_plans MODIFY updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);'));
  console.log('Fixed promotion_plans');
  process.exit(0);
}
main().catch(console.error);

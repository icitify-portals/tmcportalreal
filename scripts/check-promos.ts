import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
  const [cols] = await db.execute(sql.raw('SHOW COLUMNS FROM promotions;'));
  console.log("promotions columns:", cols);
  process.exit(0);
}
main().catch(console.error);

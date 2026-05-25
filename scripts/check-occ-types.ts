import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
  const [types] = await db.execute(sql.raw('SELECT * FROM occasion_types;'));
  console.log("Occasion Types:", types);
  process.exit(0);
}
main().catch(console.error);

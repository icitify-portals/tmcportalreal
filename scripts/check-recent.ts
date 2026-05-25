import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
  const [burials] = await db.execute(sql.raw('SELECT * FROM burial_requests ORDER BY createdAt DESC LIMIT 5;'));
  console.log("Burial Requests:", burials);

  const [occasions] = await db.execute(sql.raw('SELECT * FROM occasion_requests ORDER BY createdAt DESC LIMIT 5;'));
  console.log("Occasion Requests:", occasions);

  process.exit(0);
}
main().catch(console.error);

import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
  const [rows] = await db.execute(sql.raw('SHOW TABLES;'));
  console.log(rows);
  
  const [ocReqs] = await db.execute(sql.raw('SHOW COLUMNS FROM occasion_requests;'));
  console.log("occasion_requests columns:", ocReqs);
  
  const [buReqs] = await db.execute(sql.raw('SHOW COLUMNS FROM burial_requests;'));
  console.log("burial_requests columns:", buReqs);
  process.exit(0);
}
main().catch(console.error);

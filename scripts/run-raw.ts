import { db } from "../lib/db";
import { sql } from "drizzle-orm";
import fs from "fs";

async function main() {
  const sqlContent = fs.readFileSync("fix.sql", "utf8");
  const stmts = sqlContent.split(";");
  for (const stmt of stmts) {
    if (stmt.trim()) {
      console.log("Executing:", stmt.trim().substring(0, 50) + "...");
      await db.execute(sql.raw(stmt));
    }
  }
  console.log("Done");
  process.exit(0);
}
main().catch(console.error);

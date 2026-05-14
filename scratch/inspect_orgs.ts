
import { db } from "./lib/db";
import { organizations } from "./lib/db/schema";
import { sql } from "drizzle-orm";

async function main() {
  const orgs = await db.select().from(organizations).limit(10);
  console.log(JSON.stringify(orgs, null, 2));
  process.exit(0);
}

main();

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
  });
  const db = drizzle(connection);

  try {
    await db.execute("ALTER TABLE programmes MODIFY COLUMN frequency ENUM('WEEKLY', 'MONTHLY', 'QUARTERLY', 'BI-ANNUALLY', 'ANNUALLY', 'ONCE', 'CUSTOM') DEFAULT 'ONCE';");
    console.log('Modified programmes frequency enum');
  } catch (e) {
    console.log(e.message);
  }

  try {
    await db.execute("ALTER TABLE meetings MODIFY COLUMN frequency ENUM('ONCE', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'CUSTOM') DEFAULT 'ONCE';");
    console.log('Modified meetings frequency enum');
  } catch (e) {
    console.log(e.message);
  }

  process.exit(0);
}

main();

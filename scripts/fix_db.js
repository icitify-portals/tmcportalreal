import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log("Connecting to Database: ", process.env.DATABASE_URL);
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
  });
  const db = drizzle(connection);

  try {
    await db.execute("ALTER TABLE programmes ADD COLUMN rruleString VARCHAR(500);");
    console.log('Added rruleString to programmes');
  } catch (e) {
    console.log('Programmes ADD COLUMN rruleString error (may already exist):', e.message);
  }

  try {
    await db.execute("ALTER TABLE meetings ADD COLUMN rruleString VARCHAR(500);");
    console.log('Added rruleString to meetings');
  } catch (e) {
    console.log('Meetings ADD COLUMN rruleString error (may already exist):', e.message);
  }
  
  try {
    await db.execute("ALTER TABLE programmes MODIFY COLUMN frequency ENUM('WEEKLY', 'MONTHLY', 'QUARTERLY', 'BI-ANNUALLY', 'ANNUALLY', 'ONCE', 'CUSTOM') DEFAULT 'ONCE';");
    console.log('Modified programmes frequency enum');
  } catch (e) {
    console.log('Programmes MODIFY ENUM error:', e.message);
  }

  try {
    await db.execute("ALTER TABLE meetings MODIFY COLUMN frequency ENUM('ONCE', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'CUSTOM') DEFAULT 'ONCE';");
    console.log('Modified meetings frequency enum');
  } catch (e) {
    console.log('Meetings MODIFY ENUM error:', e.message);
  }

  console.log("Database patch completed.");
  process.exit(0);
}

main();

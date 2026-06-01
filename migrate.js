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
    await db.execute('ALTER TABLE programmes ADD COLUMN rruleString VARCHAR(500);');
    console.log('Added rruleString to programmes');
  } catch (e) {
    console.log(e.message);
  }

  try {
    await db.execute('ALTER TABLE meetings ADD COLUMN rruleString VARCHAR(500);');
    console.log('Added rruleString to meetings');
  } catch (e) {
    console.log(e.message);
  }

  process.exit(0);
}

main();

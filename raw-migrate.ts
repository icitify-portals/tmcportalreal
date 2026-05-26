import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    database: 'tmc_portal'
  });
  
  await connection.execute(`ALTER TABLE meetings ADD COLUMN targetAudience ENUM('OFFICIALS_ONLY', 'ALL_MEMBERS_JURISDICTION', 'ALL_MEMBERS_GLOBAL') DEFAULT 'ALL_MEMBERS_JURISDICTION'`);
  console.log("Migration complete.");
  process.exit(0);
}

main().catch(console.error);

import * as dotenv from "dotenv";
import path from "path";
import mysql from "mysql2/promise";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function check() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  
  const [states] = await conn.execute("SELECT count(*) as c FROM organizations WHERE level='STATE'");
  const [lgas] = await conn.execute("SELECT count(*) as c FROM organizations WHERE level='LOCAL_GOVERNMENT'");
  const [branches] = await conn.execute("SELECT count(*) as c FROM organizations WHERE level='BRANCH'");
  
  console.log(`DB Counts -> States: ${(states as any)[0].c}, LGAs: ${(lgas as any)[0].c}, Branches: ${(branches as any)[0].c}`);
  
  await conn.end();
}
check();

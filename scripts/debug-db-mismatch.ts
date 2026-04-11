import { db } from "../lib/db";
import { organizations } from "../lib/db/schema";
import { sql } from "drizzle-orm";

async function main() {
    const allOrgs = await db.query.organizations.findMany();
    const lgasOrm = allOrgs.filter(o => o.level === 'LOCAL_GOVERNMENT').length;
    const branchesOrm = allOrgs.filter(o => o.level === 'BRANCH').length;
    
    console.log("ORM COUNTS:");
    console.log(`LGAs: ${lgasOrm}, Branches: ${branchesOrm}`);
    
    // Raw query using exact same connection pool
    const resLgas = await db.execute(sql`SELECT COUNT(*) as c FROM organizations WHERE level='LOCAL_GOVERNMENT'`);
    const resBranches = await db.execute(sql`SELECT COUNT(*) as c FROM organizations WHERE level='BRANCH'`);
    
    const [rawLga] = resLgas as any; // Depending on mysql driver format
    const [rawBranch] = resBranches as any;
    
    console.log("RAW SQL COUNTS VIA DRIZZLE POOL:");
    console.log(JSON.stringify({ rawLga, rawBranch }));
}

main().catch(console.error).finally(() => process.exit(0));

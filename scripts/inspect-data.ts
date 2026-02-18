
import { db } from "../lib/db";
import { jurisdictionCodes } from "../lib/db/schema";
import { eq, inArray } from "drizzle-orm";

async function main() {
    console.log("\nChecking Jurisdiction Codes...");

    // Check Nigeria and Benin
    const countries = await db.query.jurisdictionCodes.findMany({
        where: inArray(jurisdictionCodes.name, ["Nigeria", "Benin"])
    });
    console.log("Countries:", countries.map(c => `${c.name}: ${c.code}`));

    // Check specific states
    const targetStates = ["Lagos", "Oyo", "Ogun", "Osun", "Kwara", "Edo", "Ondo", "Ekiti", "Abuja", "Niger"];
    const states = await db.query.jurisdictionCodes.findMany({
        where: inArray(jurisdictionCodes.name, targetStates)
    });

    console.log("States:");
    states.forEach(s => console.log(`${s.name}: ${s.code}`));
}

main().catch(console.error).finally(() => process.exit(0));

import { db } from "../lib/db/index.ts";
import { programmeRegistrations, programmes } from "../lib/db/schema.ts";
import { eq, isNotNull } from "drizzle-orm";

async function run() {
    try {
        console.log("Running query...");
        const paidRegistrations = await db.select({
            reg: programmeRegistrations,
            programme: programmes
        }).from(programmeRegistrations)
        .leftJoin(programmes, eq(programmeRegistrations.programmeId, programmes.id))
        .where(isNotNull(programmeRegistrations.paymentReference));
        
        console.log("Success, found records:", paidRegistrations.length);
    } catch (e: any) {
        console.error("Error executing query:");
        console.error(e.message);
        console.error("Cause:", e.cause);
    }
    process.exit(0);
}

run();

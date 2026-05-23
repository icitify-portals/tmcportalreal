import { db } from "../lib/db";
import { programmes } from "../lib/db/schema";
import { eq, and } from "drizzle-orm";

async function main() {
    try {
        console.log("Locating test programmes to delete...");

        // Safety criteria based on exact match of what was requested to be removed
        const targetProgrammes = await db.select({
            id: programmes.id,
            title: programmes.title,
            format: programmes.format,
            venue: programmes.venue,
            frequency: programmes.frequency,
            status: programmes.status
        }).from(programmes).where(
            and(
                eq(programmes.title, "Test programme"),
                eq(programmes.format, "VIRTUAL"),
                eq(programmes.venue, "Virtual Room"),
                eq(programmes.frequency, "ONCE")
            )
        );

        if (targetProgrammes.length === 0) {
            console.log("No test programmes matching the exact criteria were found.");
            process.exit(0);
        }

        console.log(`Found ${targetProgrammes.length} matching test programmes:`);
        targetProgrammes.forEach(p => console.log(`- ID: ${p.id} | Status: ${p.status || 'EMPTY'}`));

        console.log("Proceeding with careful deletion...");

        // Delete each found record one by one to ensure careful removal
        let deletedCount = 0;
        for (const p of targetProgrammes) {
            await db.delete(programmes).where(eq(programmes.id, p.id));
            deletedCount++;
            console.log(`✅ Successfully deleted programme ID: ${p.id}`);
        }

        console.log(`\n🎉 Deletion complete. Removed ${deletedCount} test programme(s).`);
        process.exit(0);
    } catch (error) {
        console.error("❌ An error occurred during deletion:");
        console.error(error);
        process.exit(1);
    }
}

main();

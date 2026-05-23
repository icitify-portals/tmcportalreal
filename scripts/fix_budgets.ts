import { db } from "../lib/db";
import { programmes, financeBudgets } from "../lib/db/schema";
import { eq, gt } from "drizzle-orm";
import crypto from "crypto";

async function fixBudgets() {
    console.log("Locating programmes with missing budgets...");
    
    // Fetch all programmes that have a budget greater than 0 (stored as string)
    // we fetch all and filter in JS to be safe, since budget is varchar/decimal
    const allProgrammes = await db.select().from(programmes);
    
    const programmesWithBudget = allProgrammes.filter(p => {
        if (!p.budget) return false;
        const b = parseFloat(p.budget.toString());
        return !isNaN(b) && b > 0;
    });

    console.log(`Found ${programmesWithBudget.length} programmes with a budget > 0`);

    // Fetch all existing budgets
    const allBudgets = await db.select().from(financeBudgets);
    const existingProgrammeIds = new Set(allBudgets.map(b => b.programmeId).filter(Boolean));

    let createdCount = 0;

    for (const prog of programmesWithBudget) {
        if (!existingProgrammeIds.has(prog.id)) {
            // Create budget
            const totalAmount = parseFloat(prog.budget!.toString()).toFixed(2);
            
            try {
                await db.insert(financeBudgets).values({
                    organizationId: prog.organizationId,
                    year: prog.startDate ? new Date(prog.startDate).getFullYear() : new Date().getFullYear(),
                    title: `Budget for Programme: ${prog.title}`,
                    totalAmount: totalAmount,
                    status: 'APPROVED',
                    createdBy: prog.createdBy,
                    programmeId: prog.id
                });
                console.log(`✅ Created budget for programme: ${prog.title} (ID: ${prog.id})`);
                createdCount++;
            } catch (err) {
                console.error(`❌ Failed to create budget for ${prog.title}:`, err);
            }
        }
    }

    console.log(`\n🎉 Fix complete. Added ${createdCount} missing budget(s).`);
    process.exit(0);
}

fixBudgets().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});

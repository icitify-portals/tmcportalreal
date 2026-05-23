import { db } from "@/lib/db";
import { programmes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        console.log("Safely looking for test programmes to delete...");

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
            return new Response(JSON.stringify({ 
                success: true, 
                message: "No test programmes matching the exact criteria were found." 
            }), { status: 200, headers: { "Content-Type": "application/json" } });
        }

        let deletedCount = 0;
        const deletedIds = [];

        // Delete each found record one by one
        for (const p of targetProgrammes) {
            await db.delete(programmes).where(eq(programmes.id, p.id));
            deletedIds.push(p.id);
            deletedCount++;
        }

        return new Response(JSON.stringify({ 
            success: true, 
            message: `Carefully removed ${deletedCount} test programme(s).`,
            deletedIds 
        }), { status: 200, headers: { "Content-Type": "application/json" } });

    } catch (error: any) {
        console.error("Deletion failed:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}

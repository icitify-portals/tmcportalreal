"use server"

import { db } from "@/lib/db"
import { members } from "@/lib/db/schema"
import { sql, eq, count } from "drizzle-orm"
import { getServerSession } from "@/lib/session"

export async function getMemberStats() {
    const session = await getServerSession()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    try {
        // 1. Total Count
        const totalResult = await db.select({ value: count() }).from(members)
        const total = totalResult[0].value

        // 2. State breakdown
        // Since metadata is JSON, we can try to extract it. 
        // If the DB is MariaDB, JSON_EXTRACT might work.
        // As a fallback/safe way, we can fetch all and group if count is small, 
        // but let's try to be efficient.
        
        const stateCounts = await db.select({
            state: sql<string>`JSON_UNQUOTE(JSON_EXTRACT(${members.metadata}, '$.state'))`,
            count: count()
        })
        .from(members)
        .groupBy(sql`JSON_EXTRACT(${members.metadata}, '$.state')`)

        // Filter out null/empty states
        const breakdown = stateCounts
            .filter(item => item.state && item.state !== 'null')
            .sort((a, b) => b.count - a.count)

        return {
            success: true,
            total,
            breakdown
        }
    } catch (error) {
        console.error("Member Stats Error:", error)
        // Fallback for older MariaDB or complex JSON: Fetch all and group in JS
        try {
            const allMetadata = await db.select({ metadata: members.metadata }).from(members)
            const counts: Record<string, number> = {}
            let total = 0
            
            allMetadata.forEach(m => {
                total++
                const meta = m.metadata as any
                const state = meta?.state || "Unknown"
                counts[state] = (counts[state] || 0) + 1
            })

            const breakdown = Object.entries(counts)
                .map(([state, count]) => ({ state, count }))
                .sort((a, b) => b.count - a.count)

            return { success: true, total, breakdown }
        } catch (e) {
            return { success: false, error: "Failed to fetch stats" }
        }
    }
}

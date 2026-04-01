'use server'

import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { like, or } from "drizzle-orm"
import { getServerSession } from "@/lib/session"

export async function searchUsers(query: string) {
    const session = await getServerSession()
    if (!session || !session.user) return []

    if (!query || query.length < 2) return []

    try {
        const results = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            image: users.image
        })
        .from(users)
        .where(
            or(
                like(users.name, `%${query}%`),
                like(users.email, `%${query}%`)
            )
        )
        .limit(10)

        return results
    } catch (error) {
        console.error("Search users error:", error)
        return []
    }
}

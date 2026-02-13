import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { eq, or, like, and, sql } from "drizzle-orm"

export async function GET(req: Request) {
    const session = await getServerSession()
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q")

    if (!query || query.length < 2) {
        return NextResponse.json([])
    }

    try {
        const usersList = await db.query.users.findMany({
            where: (u, { or, like }) => or(
                like(u.name, `%${query}%`),
                like(u.email, `%${query}%`)
            ),
            limit: 10,
            columns: {
                id: true,
                name: true,
                email: true,
                image: true
            }
        })

        return NextResponse.json(usersList)
    } catch (error) {
        console.error("User search error:", error)
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { posts, organizations, users } from "@/lib/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { z } from "zod"

const postSchema = z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    excerpt: z.string().optional(),
    type: z.enum(["NEWS", "EVENT", "ANNOUNCEMENT"]),
    isPublished: z.boolean().optional(),
    organizationId: z.string().optional(),
})

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get("organizationId")
        const type = searchParams.get("type") as "NEWS" | "EVENT" | "ANNOUNCEMENT" | null
        const limit = parseInt(searchParams.get("limit") || "10")

        const conditions = []
        if (organizationId) conditions.push(eq(posts.organizationId, organizationId))
        if (type) conditions.push(eq(posts.postType, type))

        const rows = await db.select({
            posts: posts,
            authorName: users.name,
            authorImage: users.image
        })
            .from(posts)
            .leftJoin(users, eq(posts.authorId, users.id))
            .where(conditions.length ? and(...conditions) : undefined)
            .orderBy(desc(posts.createdAt))
            .limit(limit)

        const data = rows.map(row => ({
            ...row.posts,
            author: {
                name: row.authorName,
                image: row.authorImage
            }
        }))

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession()
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const json = await request.json()
        const body = postSchema.parse(json)

        const slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4)

        let targetOrgId = body.organizationId
        if (!targetOrgId) {
            // Fallback to finding a National org if none provided
            const national = await db.query.organizations.findFirst({ where: eq(organizations.level, "NATIONAL") })
            if (national) targetOrgId = national.id
        }

        if (!targetOrgId) {
            return NextResponse.json({ error: "Organization ID required" }, { status: 400 })
        }

        await db.insert(posts).values({
            title: body.title,
            content: body.content,
            excerpt: body.excerpt,
            postType: body.type,
            slug: slug,
            isPublished: body.isPublished || false,
            publishedAt: body.isPublished ? new Date() : null,
            organizationId: targetOrgId,
            authorId: session.user.id
        })

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error("Post creation error", error)
        return NextResponse.json({ error: error.message || "Failed to create post" }, { status: 500 })
    }
}

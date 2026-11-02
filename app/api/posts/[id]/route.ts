import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { canUserManagePosts } from "@/lib/posts-auth-server"
import { db } from "@/lib/db"
import { posts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const updatePostSchema = z.object({
    title: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    excerpt: z.string().optional().nullable(),
    coverImage: z.string().optional().nullable(),
    type: z.enum(["NEWS", "EVENT", "ANNOUNCEMENT"]).optional(),
    isPublished: z.boolean().optional(),
    organizationId: z.string().optional(),
})

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const post = await db.query.posts.findFirst({
            where: eq(posts.id, id)
        })

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 })
        }

        return NextResponse.json(post)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession()
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const authorized = await canUserManagePosts(session)
        if (!authorized) {
            return NextResponse.json(
                { error: "Forbidden: Only National Admins or the NAIPA Office can update posts." },
                { status: 403 }
            )
        }

        const { id } = await params
        const existing = await db.query.posts.findFirst({
            where: eq(posts.id, id)
        })

        if (!existing) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 })
        }

        const json = await request.json()
        const body = updatePostSchema.parse(json)

        await db.update(posts)
            .set({
                ...(body.title !== undefined && { title: body.title }),
                ...(body.content !== undefined && { content: body.content }),
                ...(body.excerpt !== undefined && { excerpt: body.excerpt || null }),
                ...(body.coverImage !== undefined && { coverImage: body.coverImage || null }),
                ...(body.type !== undefined && { postType: body.type }),
                ...(body.isPublished !== undefined && {
                    isPublished: body.isPublished,
                    publishedAt: body.isPublished ? (existing.publishedAt || new Date()) : null,
                }),
                ...(body.organizationId !== undefined && { organizationId: body.organizationId }),
                updatedAt: new Date(),
            })
            .where(eq(posts.id, id))

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Post update error", error)
        return NextResponse.json({ error: error.message || "Failed to update post" }, { status: 500 })
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession()
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const authorized = await canUserManagePosts(session)
        if (!authorized) {
            return NextResponse.json(
                { error: "Forbidden: Only National Admins or the NAIPA Office can delete posts." },
                { status: 403 }
            )
        }

        const { id } = await params
        await db.delete(posts).where(eq(posts.id, id))

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Post delete error", error)
        return NextResponse.json({ error: error.message || "Failed to delete post" }, { status: 500 })
    }
}

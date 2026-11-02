export const dynamic = 'force-dynamic'

import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { posts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PostForm } from "@/components/admin/posts/post-form"

interface EditPostPageProps {
    params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: EditPostPageProps) {
    const { id } = await params
    const post = await db.query.posts.findFirst({
        where: eq(posts.id, id)
    })

    if (!post) {
        return notFound()
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Edit Post</h2>
                    <p className="text-muted-foreground">Update post details, cover picture, and rich text content.</p>
                </div>
                <PostForm initialData={post} />
            </div>
        </DashboardLayout>
    )
}

export const dynamic = 'force-dynamic'

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PostForm } from "@/components/admin/posts/post-form"

export default function CreatePostPage() {
    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Create New Post</h2>
                    <p className="text-muted-foreground">Share news, events, or announcements.</p>
                </div>
                <PostForm />
            </div>
        </DashboardLayout>
    )
}

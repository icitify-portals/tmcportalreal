export const dynamic = 'force-dynamic'

import { db } from "@/lib/db"
import { posts, users, organizations } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Edit, Trash } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default async function PostsPage() {
    const rows = await db.select()
        .from(posts)
        .leftJoin(users, eq(posts.authorId, users.id))
        .leftJoin(organizations, eq(posts.organizationId, organizations.id))
        .orderBy(desc(posts.createdAt))

    const allPosts = rows.map(row => ({
        ...row.posts,
        author: row.users,
        organization: row.organizations
    }))

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Communication</h2>
                        <p className="text-muted-foreground">Manage news, events, and announcements.</p>
                    </div>
                    <Button asChild>
                        <Link href="/dashboard/admin/posts/new">
                            <Plus className="mr-2 h-4 w-4" /> Create Post
                        </Link>
                    </Button>
                </div>

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Organization</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allPosts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No posts found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                allPosts.map((post) => (
                                    <TableRow key={post.id}>
                                        <TableCell className="font-medium">
                                            {post.title}
                                            <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                                                {post.slug}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{post.postType}</Badge>
                                        </TableCell>
                                        <TableCell>{post.organization?.name || "N/A"}</TableCell>
                                        <TableCell>
                                            <Badge variant={post.isPublished ? "default" : "secondary"}>
                                                {post.isPublished ? "Published" : "Draft"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{post.createdAt ? format(new Date(post.createdAt), "MMM d, yyyy") : "N/A"}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/dashboard/admin/posts/${post.id}`}>
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive">
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </DashboardLayout>
    )
}

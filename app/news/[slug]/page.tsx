export const dynamic = "force-dynamic"

import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { posts, users, organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { format } from "date-fns"
import { PublicNav } from "@/components/layout/public-nav"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, Building2, ArrowLeft } from "lucide-react"

interface PostDetailPageProps {
    params: Promise<{ slug: string }>
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
    const { slug } = await params

    const rows = await db
        .select({
            post: posts,
            authorName: users.name,
            orgName: organizations.name,
        })
        .from(posts)
        .leftJoin(users, eq(posts.authorId, users.id))
        .leftJoin(organizations, eq(posts.organizationId, organizations.id))
        .where(eq(posts.slug, slug))
        .limit(1)

    if (!rows.length) {
        return notFound()
    }

    const { post, authorName, orgName } = rows[0]

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <PublicNav />

            <main className="flex-grow container mx-auto px-4 py-10 max-w-4xl">
                <div className="mb-6">
                    <Link
                        href="/news"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-green-700"
                    >
                        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to All News
                    </Link>
                </div>

                <article className="space-y-8 bg-card border rounded-xl p-6 md:p-10 shadow-sm">
                    <header className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge variant={post.postType === "NEWS" ? "default" : "secondary"}>
                                {post.postType || "NEWS"}
                            </Badge>
                            {orgName && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Building2 className="h-3.5 w-3.5" />
                                    {orgName}
                                </span>
                            )}
                            {post.createdAt && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {format(new Date(post.createdAt), "MMMM d, yyyy")}
                                </span>
                            )}
                            {authorName && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <User className="h-3.5 w-3.5" />
                                    {authorName}
                                </span>
                            )}
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                            {post.title}
                        </h1>

                        {post.excerpt && (
                            <p className="text-lg text-muted-foreground leading-relaxed border-l-4 border-green-600 pl-4">
                                {post.excerpt}
                            </p>
                        )}
                    </header>

                    {post.coverImage && (
                        <div className="w-full overflow-hidden rounded-xl border bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={post.coverImage}
                                alt={post.title}
                                className="w-full max-h-[520px] object-cover"
                            />
                        </div>
                    )}

                    <div
                        className="prose prose-green sm:prose-lg dark:prose-invert max-w-none leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                </article>
            </main>
        </div>
    )
}

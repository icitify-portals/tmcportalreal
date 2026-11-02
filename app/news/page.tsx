export const dynamic = "force-dynamic"

import Link from "next/link"
import { db } from "@/lib/db"
import { posts, organizations } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { format } from "date-fns"
import { PublicNav } from "@/components/layout/public-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Newspaper, Calendar, ArrowRight, ArrowLeft } from "lucide-react"

export default async function NewsListPage() {
    const rows = await db
        .select({
            post: posts,
            orgName: organizations.name,
        })
        .from(posts)
        .leftJoin(organizations, eq(posts.organizationId, organizations.id))
        .orderBy(desc(posts.createdAt))

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <PublicNav />

            <main className="flex-grow container mx-auto px-4 py-10 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
                    <div>
                        <Link
                            href="/"
                            className="inline-flex items-center text-sm text-muted-foreground hover:text-green-700 mb-2"
                        >
                            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Home
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Newspaper className="h-7 w-7 text-green-700" />
                            News, Events & Announcements
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Stay up to date with the latest updates from The Muslim Congress.
                        </p>
                    </div>
                </div>

                {rows.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground border rounded-lg bg-muted/20">
                        <Newspaper className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No posts have been published yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rows.map(({ post, orgName }) => (
                            <Card key={post.id} className="flex flex-col h-full hover:shadow-md transition-all">
                                {post.coverImage ? (
                                    <div className="h-52 w-full bg-muted rounded-t-lg overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={post.coverImage}
                                            alt={post.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-52 w-full bg-primary/10 rounded-t-lg flex items-center justify-center text-primary/30">
                                        <Newspaper className="h-16 w-16" />
                                    </div>
                                )}
                                <CardHeader>
                                    <div className="flex justify-between items-center gap-2">
                                        <Badge variant={post.postType === "NEWS" ? "default" : "secondary"} className="text-xs">
                                            {post.postType || "NEWS"}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {post.createdAt ? format(new Date(post.createdAt), "MMM d, yyyy") : ""}
                                        </span>
                                    </div>
                                    <CardTitle className="line-clamp-2 text-lg mt-2">{post.title}</CardTitle>
                                    {orgName && (
                                        <p className="text-xs text-muted-foreground">{orgName}</p>
                                    )}
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                        {post.excerpt || post.content.replace(/<[^>]*>?/gm, "").substring(0, 160)}
                                    </p>
                                </CardContent>
                                <div className="p-6 pt-0 mt-auto">
                                    <Button variant="ghost" size="sm" asChild className="p-0 h-auto font-medium text-green-600 hover:text-green-700 hover:bg-transparent">
                                        <Link href={`/news/${post.slug}`} className="flex items-center gap-1">
                                            Read full story <ArrowRight className="h-3 w-3" />
                                        </Link>
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}

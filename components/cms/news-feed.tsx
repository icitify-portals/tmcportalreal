
import React from "react";
import Link from 'next/link';
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { format } from "date-fns";
import { Newspaper, Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NewsFeedProps {
    organizationId?: string;
}

export async function NewsFeed({ organizationId }: NewsFeedProps) {
    const postsData = await db.query.posts.findMany({
        where: organizationId ? eq(posts.organizationId, organizationId) : undefined,
        orderBy: [desc(posts.createdAt)],
        limit: 3,
    });

    if (postsData.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground border rounded-lg bg-muted/30">
                <p>No recent news or updates available securely at this time.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {postsData.map((post) => (
                <Card key={post.id} className="flex flex-col h-full hover:shadow-md transition-all">
                    {post.coverImage ? (
                        <div className="h-48 w-full bg-gray-200 rounded-t-lg overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="h-48 w-full bg-primary/10 rounded-t-lg flex items-center justify-center text-primary/30">
                            <Newspaper className="h-16 w-16" />
                        </div>
                    )}
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <Badge variant={post.postType === 'NEWS' ? 'default' : 'secondary'} className="mb-2 text-xs">
                                {post.postType || 'NEWS'}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {post.createdAt ? format(new Date(post.createdAt), 'MMM d, yyyy') : ''}
                            </span>
                        </div>
                        <CardTitle className="line-clamp-2 text-lg">{post.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <div className="text-sm text-muted-foreground line-clamp-3 prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: post.excerpt || post.content.substring(0, 150) + "..." }} />
                    </CardContent>
                    <div className="p-6 pt-0 mt-auto">
                        <Button variant="ghost" size="sm" asChild className="p-0 h-auto font-medium text-green-600 hover:text-green-700 hover:bg-transparent p-0">
                            <Link href={`#`} className="flex items-center gap-1">
                                Read full story <ArrowRight className="h-3 w-3" />
                            </Link>
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    )
}


import { db } from "@/lib/db"
import { organizations, pages } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { notFound } from "next/navigation"
import { format } from "date-fns"

export const dynamic = "force-dynamic"

export default async function CMSPage({
    params
}: {
    params: Promise<{ jurisdiction: string, slug: string }>
}) {
    const { jurisdiction, slug } = await params
    const orgCode = jurisdiction.toUpperCase()

    // 1. Get Org
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.code, orgCode),
    })

    if (!org) {
        return notFound()
    }

    // 2. Get Page
    const page = await db.query.pages.findFirst({
        where: and(
            eq(pages.slug, slug),
            eq(pages.organizationId, org.id),
            eq(pages.isPublished, true)
        ),
    })

    if (!page) {
        return notFound()
    }

    return (
        <article className="container max-w-4xl py-12 px-4 md:px-6">
            <header className="mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl mb-4">{page.title}</h1>
                {page.updatedAt && (
                    <p className="text-sm text-muted-foreground">
                        Last updated: {format(new Date(page.updatedAt), 'PP')}
                    </p>
                )}
            </header>

            <div
                className="prose prose-gray dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: page.content || "" }}
            />
        </article>
    )
}

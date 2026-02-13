export const dynamic = 'force-dynamic'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Edit, Eye, Trash, FileText } from "lucide-react"
import { getAllPages, deletePage } from "@/lib/actions/pages"
import { getServerSession } from "@/lib/session"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { revalidatePath } from "next/cache"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"


export default async function CMSPagesList() {
    const session = await getServerSession()

    // Determine organization context
    let organizationId = session?.user?.officialOrganizationId ||
        session?.user?.memberOrganizationId ||
        session?.user?.roles?.find((r: any) => r.organizationId)?.organizationId

    // Super Admin Fallback: If no orgId is found, find the National Org
    if (!organizationId && session?.user?.isSuperAdmin) {
        const nationalOrg = await db.query.organizations.findFirst({
            where: eq(organizations.level, "NATIONAL"),
        })
        organizationId = nationalOrg?.id
    }

    // Fetch org for code (for preview links)
    const org = organizationId ? await db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
    }) : null

    // If no organization (e.g. system admin checking generally, or error), we might pass undefined or handle it.
    // For now we assume pages belong to an org.
    const { data: pages } = organizationId ? await getAllPages(organizationId) : { data: [] }

    async function handleDelete(id: string) {
        "use server"
        await deletePage(id)
        revalidatePath("/dashboard/admin/cms/pages")
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">CMS Pages</h2>
                        <p className="text-muted-foreground">Manage dynamic pages content.</p>
                    </div>
                    <Button asChild>
                        <Link href="/dashboard/admin/cms/pages/new">
                            <Plus className="mr-2 h-4 w-4" /> Create Page
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pages?.map((page) => (
                        <Card key={page.id} className="overflow-hidden">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg line-clamp-1" title={page.title}>{page.title}</CardTitle>
                                    <Badge variant={page.isPublished ? "default" : "secondary"}>
                                        {page.isPublished ? "Published" : "Draft"}
                                    </Badge>
                                </div>
                                <CardDescription className="font-mono text-xs">/{page.slug}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                                    {page.content ? page.content.replace(/<[^>]*>?/gm, '').substring(0, 100) : "No content..."}
                                </div>
                                <div className="flex items-center gap-2 mt-auto">
                                    <Button size="sm" variant="outline" className="flex-1" asChild>
                                        <Link href={`/dashboard/admin/cms/pages/${page.id}`}>
                                            <Edit className="mr-2 h-3 w-3" /> Edit
                                        </Link>
                                    </Button>
                                    <Button size="sm" variant="ghost" asChild>
                                        <Link href={org ? `/${org.code.toLowerCase()}/p/${page.slug}` : `#`} target="_blank">
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <form action={handleDelete.bind(null, page.id)}>
                                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" type="submit">
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </form>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {(!pages || pages.length === 0) && (
                        <div className="col-span-full py-12 text-center bg-muted/30 rounded-lg border-dashed border-2">
                            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                            <h3 className="text-lg font-medium">No pages found</h3>
                            <p className="text-muted-foreground mb-4">Get started by creating your first page.</p>
                            <Button asChild>
                                <Link href="/dashboard/admin/cms/pages/new">
                                    <Plus className="mr-2 h-4 w-4" /> Create Page
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}


export const dynamic = 'force-dynamic'


import { getPageBySlug } from "@/lib/actions/pages"
import PageEditor from "@/components/admin/cms/page-editor"
import { db } from "@/lib/db"
import { pages } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { DashboardLayout } from "@/components/layout/dashboard-layout"


import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { organizations } from "@/lib/db/schema"

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
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

    if (!organizationId) {
        return <div>Unauthorized or no organization associated</div>
    }

    // If 'new', render empty editor
    if (id === 'new') {
        return (
            <DashboardLayout>
                <PageEditor organizationId={organizationId} />
            </DashboardLayout>
        )
    }

    const page = await db.query.pages.findFirst({
        where: eq(pages.id, id)
    })

    if (!page) {
        return <div>Page not found</div>
    }

    // Convert keys to satisfy types if needed, or pass directly
    return (
        <DashboardLayout>
            <PageEditor pageId={page.id} initialData={page} organizationId={organizationId} />
        </DashboardLayout>
    )
}

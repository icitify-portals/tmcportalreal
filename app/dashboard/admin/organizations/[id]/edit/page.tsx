export const dynamic = 'force-dynamic'


import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { OrganizationForm } from "@/components/admin/organizations/organization-form"
import { db } from "@/lib/db"
import { desc, eq, not } from "drizzle-orm"
import { organizations } from "@/lib/db/schema"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { notFound } from "next/navigation"


export default async function EditOrganizationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // Fetch the organization to edit
    const orgToEdit = await db.query.organizations.findFirst({
        where: eq(organizations.id, id),
    })

    if (!orgToEdit) {
        return notFound()
    }

    // Fetch all other orgs for parent selection, excluding self
    const allOrgs = await db.query.organizations.findMany({
        where: not(eq(organizations.id, id)),
        orderBy: [desc(organizations.name)],
    })

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/admin/organizations/${id}`}>
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Edit Organization</h2>
                        <p className="text-muted-foreground">Update details for {orgToEdit.name}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-card border rounded-lg p-6">
                    <OrganizationForm organizations={allOrgs} initialData={orgToEdit} />
                </div>
            </div>
        </DashboardLayout>
    )
}

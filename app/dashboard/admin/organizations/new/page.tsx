export const dynamic = 'force-dynamic'

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { OrganizationForm } from "@/components/admin/organizations/organization-form"
import { db } from "@/lib/db"
import { desc } from "drizzle-orm"
import { organizations } from "@/lib/db/schema"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"


export default async function NewOrganizationPage() {
    const allOrgs = await db.query.organizations.findMany({
        orderBy: [desc(organizations.name)],
    })

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin/organizations">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">New Organization</h2>
                        <p className="text-muted-foreground">Add a new jurisdiction to the hierarchy.</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-card border rounded-lg p-6">
                    <OrganizationForm organizations={allOrgs} />
                </div>
            </div>
        </DashboardLayout>
    )
}

export const dynamic = 'force-dynamic'

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { offices, userRoles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { OfficeManagement } from "@/components/admin/settings/office-management"

export default async function OfficesSettingsPage() {
    const session = await getServerSession()
    
    // We need the user's organizationId
    const [userRole] = await db.select().from(userRoles).where(eq(userRoles.userId, session?.user?.id || "")).limit(1)
    const organizationId = userRole?.organizationId

    let orgOffices: any[] = []
    if (organizationId) {
        orgOffices = await db.select().from(offices).where(eq(offices.organizationId, organizationId))
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-5xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <Button variant="outline" size="icon" asChild>
                                <Link href="/dashboard/admin/settings">
                                    <ArrowLeft className="h-4 w-4" />
                                </Link>
                            </Button>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <Shield className="h-8 w-8 text-primary" />
                                Offices & Permissions
                            </h1>
                        </div>
                        <p className="text-muted-foreground ml-14">
                            Manage offices and configure which Special Programme categories each office can handle.
                        </p>
                    </div>
                </div>

                <div className="ml-14">
                    <OfficeManagement offices={orgOffices} />
                </div>
            </div>
        </DashboardLayout>
    )
}

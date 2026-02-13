export const dynamic = 'force-dynamic'

import { getServerSession } from "@/lib/session"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Plus, Building2, MapPin, GitCommit } from "lucide-react"
import Link from "next/link"
import { getOrganizationTree } from "@/lib/org-helper"
import { OrganizationTree } from "@/components/admin/organizations/organization-tree"
import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { asc } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"


export default async function OrganizationsPage() {
    const session = await getServerSession()

    // Fetch hierarchical data
    const orgTree = await getOrganizationTree()

    // Fetch all for edit form usage and stats
    const allOrgs = await db.query.organizations.findMany({
        orderBy: [asc(organizations.name)],
    })

    const stats = {
        states: allOrgs.filter(o => o.level === "STATE").length,
        lgas: allOrgs.filter(o => o.level === "LOCAL_GOVERNMENT").length,
        branches: allOrgs.filter(o => o.level === "BRANCH").length,
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Building2 className="h-8 w-8 text-primary" />
                            Organizations
                        </h1>
                        <p className="text-muted-foreground">Manage organization hierarchy (National &gt; State &gt; LGA &gt; Branch)</p>
                    </div>
                    <Button asChild>
                        <Link href="/dashboard/admin/organizations/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Organization
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total States</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.states}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total LGAs</CardTitle>
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.lgas}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
                            <GitCommit className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.branches}</div>
                        </CardContent>
                    </Card>
                </div>

                <OrganizationTree data={orgTree} allOrgs={allOrgs} />
            </div>
        </DashboardLayout>
    )
}

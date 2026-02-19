export const dynamic = 'force-dynamic'

import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Building2 } from "lucide-react"
import { getAllOrgans } from "@/lib/actions/organs"
import { OrgansList } from "./organs-list"

export default async function AdminOrgansPage() {
    const res = await getAllOrgans()
    const organs = res.success && res.data ? res.data : []

    const activeCount = organs.filter(o => o.isActive).length

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Building2 className="h-8 w-8 text-primary" />
                            Our Organs
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage TMC institutional organs and subsidiaries
                        </p>
                    </div>
                    <Link href="/dashboard/admin/organs/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Organ
                        </Button>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Organs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{organs.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-muted-foreground">{organs.length - activeCount}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Organs Directory</CardTitle>
                        <CardDescription>
                            All TMC organs. Toggle visibility with the Active switch. Click Edit to update details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <OrgansList initialOrgans={organs} />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}

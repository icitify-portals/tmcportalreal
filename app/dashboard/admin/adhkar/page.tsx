export const dynamic = 'force-dynamic'

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, MapPin, Search } from "lucide-react"
import Link from "next/link"
import { getAdhkarCentres, deleteAdhkarCentre } from "@/lib/actions/adhkar"
import { AdhkarCentreList } from "./adhkar-list"


export default async function AdminAdhkarPage() {
    const res = await getAdhkarCentres()
    const centres = res.success && res.data ? res.data : []

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <MapPin className="h-8 w-8 text-primary" />
                            Adhkar Centres
                        </h1>
                        <p className="text-muted-foreground">Manage spiritual gathering locations</p>
                    </div>
                    <Link href="/dashboard/admin/adhkar/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Centre
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Centres Directory</CardTitle>
                        <CardDescription>List of all active Adhkar centres</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AdhkarCentreList initialCentres={centres} />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}

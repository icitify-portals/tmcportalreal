export const dynamic = 'force-dynamic'

import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, BookOpen } from "lucide-react"
import { getAllTmcProgrammes } from "@/lib/actions/tmc-programmes"
import { TmcProgrammesList } from "./tmc-programmes-list"

export default async function AdminTmcProgrammesPage() {
    const res = await getAllTmcProgrammes()
    const programmes = res.success && res.data ? res.data : []
    const activeCount = programmes.filter(p => p.isActive).length

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <BookOpen className="h-8 w-8 text-primary" />
                            Our Programmes
                        </h1>
                        <p className="text-muted-foreground mt-1">Manage TMC institutional programme definitions</p>
                    </div>
                    <Link href="/dashboard/admin/tmc-programmes/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Programme
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{programmes.length}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-green-600">{activeCount}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-muted-foreground">{programmes.length - activeCount}</div></CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Programmes Directory</CardTitle>
                        <CardDescription>All TMC core programmes. Toggle visibility with the Active switch.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TmcProgrammesList initialProgrammes={programmes} />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}

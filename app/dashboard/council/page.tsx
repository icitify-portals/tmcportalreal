export const dynamic = 'force-dynamic'

import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"
import { programmes, reports, programmeReports } from "@/lib/db/schema"
import { eq, count, and, isNotNull } from "drizzle-orm"
import { FileText, Calendar } from "lucide-react"

export default async function CouncilDashboardPage() {
    const session = await getServerSession()

    if (!session?.user) return redirect("/auth/signin")

    const isCouncil = session.user.roles?.some((r: any) => r.code === "COUNCIL")
    if (!isCouncil && !session.user.isSuperAdmin) {
        // If not council and not super admin, maybe redirect or show unauthorized
        // But for now let's assume middleware/layout handles basic protection, 
        // or we redirect to their specific dashboard
        return redirect("/dashboard")
    }

    // Fetch some stats
    const [reportCountRes, programmeCountRes] = await Promise.all([
        db.select({ count: count() }).from(programmeReports),
        db.select({ count: count() }).from(programmes),
    ])

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Council Dashboard</h1>
                    <p className="text-muted-foreground">Overview of organization activities.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Reports Submitted</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{reportCountRes[0].count}</div>
                            <p className="text-xs text-muted-foreground">Total event reports</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Programmes</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{programmeCountRes[0].count}</div>
                            <p className="text-xs text-muted-foreground">Active programmes</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}

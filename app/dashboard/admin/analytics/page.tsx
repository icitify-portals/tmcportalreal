export const dynamic = 'force-dynamic'

import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { siteVisits, users } from "@/lib/db/schema"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { count, sql, desc, and, gte, eq } from "drizzle-orm"
import { BarChart3, Users, Globe, Clock } from "lucide-react"


export default async function AnalyticsPage() {
    const session = await getServerSession()

    // Authorization check
    const isAuthorized = session?.user?.isSuperAdmin ||
        session?.user?.roles?.some((r: any) =>
            r.jurisdictionLevel === "SYSTEM" ||
            r.code === "NATIONAL_ADMIN" ||
            r.code === "NATIONAL_ICT_OFFICER"
        )

    if (!isAuthorized) {
        return (
            <DashboardLayout>
                <div className="p-6 text-center">
                    <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
                    <p className="text-muted-foreground mt-2">You do not have permission to view site analytics.</p>
                </div>
            </DashboardLayout>
        )
    }

    // Get stats
    const [totalPageViews] = await db.select({ value: count() }).from(siteVisits)

    const [uniqueVisitors] = await db.select({
        value: sql<number>`count(distinct visitorId)`
    }).from(siteVisits)

    const [totalSessions] = await db.select({
        value: sql<number>`count(distinct sessionId)`
    }).from(siteVisits)

    // Top Pages
    const topPages = await db.select({
        path: siteVisits.path,
        count: count()
    })
        .from(siteVisits)
        .groupBy(siteVisits.path)
        .orderBy(desc(count()))
        .limit(10)

    // Recent Visits
    const recentVisitsResults = await db.select({
        visit: siteVisits,
        user: users
    })
        .from(siteVisits)
        .leftJoin(users, eq(siteVisits.userId, users.id))
        .orderBy(desc(siteVisits.createdAt))
        .limit(10)

    const recentVisits = recentVisitsResults.map(r => ({
        ...r.visit,
        user: r.user ? { name: r.user.name, email: r.user.email } : null
    }))

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Site Analytics</h1>
                    <p className="text-muted-foreground">Monitor website traffic and visitor engagement</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
                            <Globe className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalPageViews.value}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{uniqueVisitors.value}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalSessions.value}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Views per Session</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {totalSessions.value > 0 ? (totalPageViews.value / totalSessions.value).toFixed(1) : 0}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Pages</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {topPages.map((page) => (
                                    <div key={page.path} className="flex items-center justify-between text-sm">
                                        <span className="font-mono text-xs">{page.path}</span>
                                        <span className="font-bold">{page.count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 text-sm">
                                {recentVisits.map((visit) => (
                                    <div key={visit.id} className="flex flex-col border-b pb-2 last:border-0">
                                        <div className="flex justify-between">
                                            <span className="font-medium">{visit.user?.name || "Guest"}</span>
                                            <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                                                {new Date(visit.createdAt!).toLocaleTimeString('en-GB')}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground truncate">{visit.path}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}

import { db } from "@/lib/db"
import { programmes, programmeRegistrations, members, users } from "@/lib/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format, differenceInMinutes, isAfter } from "date-fns"
import { Clock, Users, MapPin, TrendingUp } from "lucide-react"

export default async function ProgrammeAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    
    const [programme] = await db.select().from(programmes).where(eq(programmes.id, id)).limit(1)
    if (!programme) return notFound()

    const registrations = await db.select({
        id: programmeRegistrations.id,
        checkInTime: programmeRegistrations.checkInTime,
        status: programmeRegistrations.status,
        member: members,
    })
    .from(programmeRegistrations)
    .leftJoin(members, eq(programmeRegistrations.memberId, members.id))
    .where(eq(programmeRegistrations.programmeId, id))

    const attended = registrations.filter(r => r.checkInTime)
    const totalAttended = attended.length
    const totalRegistered = registrations.length
    
    // 1. Lateness Analysis
    let totalLateMinutes = 0
    let lateCount = 0
    let earlyCount = 0
    const programmeStart = new Date(programme.startDate)

    attended.forEach(reg => {
        const checkIn = new Date(reg.checkInTime!)
        if (isAfter(checkIn, programmeStart)) {
            lateCount++
            totalLateMinutes += differenceInMinutes(checkIn, programmeStart)
        } else {
            earlyCount++
        }
    })

    const avgLateness = lateCount > 0 ? Math.round(totalLateMinutes / lateCount) : 0
    const latenessRate = totalAttended > 0 ? Math.round((lateCount / totalAttended) * 100) : 0

    // 2. Jurisdiction Representation
    const stateStats: Record<string, number> = {}
    const lgaStats: Record<string, number> = {}

    registrations.forEach(reg => {
        const meta = reg.member?.metadata as any
        const state = meta?.state || "Unknown"
        const lga = meta?.lga || "Unknown"
        
        stateStats[state] = (stateStats[state] || 0) + 1
        lgaStats[lga] = (lgaStats[lga] || 0) + 1
    })

    const sortedStates = Object.entries(stateStats).sort((a, b) => b[1] - a[1])
    const sortedLgas = Object.entries(lgaStats).sort((a, b) => b[1] - a[1]).slice(0, 10)

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Programme Analytics</h1>
                    <p className="text-muted-foreground">{programme.title}</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-blue-50/50 border-blue-100">
                        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-blue-900">Total Registered</CardTitle>
                            <Users className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-black">{totalRegistered}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50/50 border-green-100">
                        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-green-900">Total Attended</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-black">{totalAttended}</div>
                            <p className="text-xs text-green-600 font-medium">
                                {totalRegistered > 0 ? Math.round((totalAttended / totalRegistered) * 100) : 0}% Attendance Rate
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-amber-50/50 border-amber-100">
                        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-amber-900">Lateness Rate</CardTitle>
                            <Clock className="h-4 w-4 text-amber-600" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-black">{latenessRate}%</div>
                            <p className="text-xs text-amber-600 font-medium">{lateCount} late participants</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-purple-50/50 border-purple-100">
                        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-purple-900">Avg. Lateness</CardTitle>
                            <Clock className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-black">{avgLateness}m</div>
                            <p className="text-xs text-purple-600 font-medium">Minutes past start time</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Jurisdiction: States */}
                    <Card>
                        <CardHeader>
                            <CardTitle>State Representation</CardTitle>
                            <CardDescription>Breakdown of participants by state.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {sortedStates.map(([state, count]) => {
                                const percentage = totalRegistered > 0 ? Math.round((count / totalRegistered) * 100) : 0
                                return (
                                    <div key={state} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-bold text-gray-700 uppercase tracking-tighter">{state}</span>
                                            <span className="font-bold text-gray-500">{count} ({percentage}%)</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-green-500 transition-all duration-500" 
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>

                    {/* Jurisdiction: LGAs */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Top LGAs</CardTitle>
                            <CardDescription>The most represented local government areas.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {sortedLgas.map(([lga, count]) => {
                                const percentage = totalRegistered > 0 ? Math.round((count / totalRegistered) * 100) : 0
                                return (
                                    <div key={lga} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-bold text-gray-700 uppercase tracking-tighter">{lga}</span>
                                            <span className="font-bold text-gray-500">{count} ({percentage}%)</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-blue-500 transition-all duration-500" 
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}

import { db } from "@/lib/db"
import { meetings, meetingAttendances, users, members } from "@/lib/db/schema"
import { eq, isNotNull } from "drizzle-orm"
import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format, differenceInMinutes, isAfter, addMinutes } from "date-fns"
import { Clock, Users, TrendingUp } from "lucide-react"

export default async function MeetingAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id)).limit(1)
    if (!meeting) return notFound()

    const attendances = await db.select({
        id: meetingAttendances.id,
        joinedAt: meetingAttendances.joinedAt,
        status: meetingAttendances.status,
        member: members,
    })
    .from(meetingAttendances)
    .leftJoin(members, eq(meetingAttendances.userId, members.userId))
    .where(eq(meetingAttendances.meetingId, id))

    const attended = attendances.filter(a => a.joinedAt != null || a.status === 'PRESENT')
    const totalAttended = attended.length
    const totalInvited = attendances.length
    
    // 1. Lateness Analysis
    let totalLateMinutes = 0
    let lateCount = 0
    let earlyCount = 0
    const meetingStart = new Date(meeting.scheduledAt)
    const thresholdTime = addMinutes(meetingStart, meeting.attendanceWindow || 30)

    attended.forEach(reg => {
        if (reg.joinedAt) {
            const checkIn = new Date(reg.joinedAt)
            if (isAfter(checkIn, thresholdTime)) {
                lateCount++
                totalLateMinutes += differenceInMinutes(checkIn, meetingStart)
            } else {
                earlyCount++
            }
        }
    })

    const avgLateness = lateCount > 0 ? Math.round(totalLateMinutes / lateCount) : 0
    const latenessRate = totalAttended > 0 ? Math.round((lateCount / totalAttended) * 100) : 0

    // 2. Jurisdiction Representation
    const stateStats: Record<string, number> = {}
    const lgaStats: Record<string, number> = {}

    attendances.forEach(reg => {
        const meta = reg.member?.metadata as any
        const state = meta?.state || "Unknown"
        const lga = meta?.lga || "Unknown"
        
        if (state && state !== "Unknown" && state !== "Unspecified") {
            stateStats[state] = (stateStats[state] || 0) + 1
        }
        if (lga && lga !== "Unknown" && lga !== "Unspecified") {
            lgaStats[lga] = (lgaStats[lga] || 0) + 1
        }
    })

    const sortedStates = Object.entries(stateStats).sort((a, b) => b[1] - a[1])
    const sortedLgas = Object.entries(lgaStats).sort((a, b) => b[1] - a[1]).slice(0, 10)

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-black tracking-tight text-black" style={{ color: "#000000" }}>Meeting Analytics</h1>
                    <p className="text-muted-foreground text-black font-semibold" style={{ color: "#000000" }}>{meeting.title} - {format(meetingStart, "PPP")}</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-blue-50/50 border-blue-100">
                        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-black uppercase tracking-wider text-black" style={{ color: "#000000" }}>Total Invited</CardTitle>
                            <Users className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-black text-black" style={{ color: "#000000" }}>{totalInvited}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50/50 border-green-100">
                        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-black uppercase tracking-wider text-black" style={{ color: "#000000" }}>Total Attended</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-black text-black" style={{ color: "#000000" }}>{totalAttended}</div>
                            <p className="text-xs text-green-600 font-bold">
                                {totalInvited > 0 ? Math.round((totalAttended / totalInvited) * 100) : 0}% Attendance Rate
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-amber-50/50 border-amber-100">
                        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-black uppercase tracking-wider text-black" style={{ color: "#000000" }}>Lateness Rate</CardTitle>
                            <Clock className="h-4 w-4 text-amber-600" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-black text-black" style={{ color: "#000000" }}>{latenessRate}%</div>
                            <p className="text-xs text-amber-600 font-bold">{lateCount} late participants</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-purple-50/50 border-purple-100">
                        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-black uppercase tracking-wider text-black" style={{ color: "#000000" }}>Avg. Lateness</CardTitle>
                            <Clock className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-black text-black" style={{ color: "#000000" }}>{avgLateness}m</div>
                            <p className="text-xs text-purple-600 font-bold">Minutes past threshold ({meeting.attendanceWindow || 30}m)</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Jurisdiction: States */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-black font-bold" style={{ color: "#000000" }}>State Representation</CardTitle>
                            <CardDescription>Breakdown of participants by state.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {sortedStates.map(([state, count]) => {
                                const percentage = totalInvited > 0 ? Math.round((count / totalInvited) * 100) : 0
                                return (
                                    <div key={state} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-bold text-white uppercase tracking-tighter" style={{ color: "#FFFFFF" }}>{state}</span>
                                            <span className="font-bold text-white" style={{ color: "#FFFFFF" }}>{count} ({percentage}%)</span>
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
                            <CardTitle className="text-black font-bold" style={{ color: "#000000" }}>Top LGAs</CardTitle>
                            <CardDescription>The most represented local government areas.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {sortedLgas.map(([lga, count]) => {
                                const percentage = totalInvited > 0 ? Math.round((count / totalInvited) * 100) : 0
                                return (
                                    <div key={lga} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-bold text-white uppercase tracking-tighter" style={{ color: "#FFFFFF" }}>{lga}</span>
                                            <span className="font-bold text-white" style={{ color: "#FFFFFF" }}>{count} ({percentage}%)</span>
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

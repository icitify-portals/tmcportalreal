"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CalendarDays, CheckCircle2, Clock } from "lucide-react"
import { format, parseISO, isSameDay } from "date-fns"

interface ProgrammeData {
    id: string
    title: string
    startDate: string
    endDate: string | null
    status: string
    venue: string
    targetAudience: string
    organizationName: string
    organizationLevel: string
    jurisdiction: string
}

export function MonthlySubmissionClient({ initialProgrammes }: { initialProgrammes: ProgrammeData[] }) {
    // Group programmes by month
    const groupedByMonth = useMemo(() => {
        const groups: Record<string, ProgrammeData[]> = {}
        
        initialProgrammes.forEach(prog => {
            const date = parseISO(prog.startDate)
            const monthKey = format(date, "MMMM yyyy")
            if (!groups[monthKey]) {
                groups[monthKey] = []
            }
            groups[monthKey].push(prog)
        })
        
        // Sort months chronologically
        return Object.entries(groups).sort((a, b) => {
            const dateA = new Date(a[0])
            const dateB = new Date(b[0])
            return dateA.getTime() - dateB.getTime()
        })
    }, [initialProgrammes])

    // Find clashes
    const getClashes = (programmes: ProgrammeData[]) => {
        const clashes: { [key: string]: ProgrammeData[] } = {}
        
        for (let i = 0; i < programmes.length; i++) {
            for (let j = i + 1; j < programmes.length; j++) {
                const p1 = programmes[i]
                const p2 = programmes[j]
                
                // Only consider clash if they are in the same jurisdiction or target same broad audience,
                // and fall on the same day.
                if (isSameDay(parseISO(p1.startDate), parseISO(p2.startDate))) {
                    if (p1.jurisdiction === p2.jurisdiction || p1.organizationLevel === 'NATIONAL' || p2.organizationLevel === 'NATIONAL') {
                        const dateKey = format(parseISO(p1.startDate), "yyyy-MM-dd")
                        if (!clashes[dateKey]) clashes[dateKey] = []
                        if (!clashes[dateKey].find(p => p.id === p1.id)) clashes[dateKey].push(p1)
                        if (!clashes[dateKey].find(p => p.id === p2.id)) clashes[dateKey].push(p2)
                    }
                }
            }
        }
        
        return clashes
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <Badge className="bg-emerald-500">Approved</Badge>
            case 'PENDING_STATE':
            case 'PENDING_NATIONAL': return <Badge variant="outline" className="text-amber-600 border-amber-600">Pending</Badge>
            case 'REJECTED': return <Badge variant="destructive">Rejected</Badge>
            default: return <Badge variant="secondary">{status}</Badge>
        }
    }

    return (
        <div className="space-y-8">
            {groupedByMonth.map(([month, programmes]) => {
                const clashes = getClashes(programmes)
                const hasClashes = Object.keys(clashes).length > 0

                return (
                    <Card key={month} className={hasClashes ? "border-amber-200" : ""}>
                        <CardHeader className="bg-slate-50/50 border-b pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="h-5 w-5 text-green-700" />
                                    <CardTitle className="text-xl text-green-900">{month}</CardTitle>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="secondary" className="font-semibold">
                                        {programmes.length} Submission{programmes.length !== 1 ? 's' : ''}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            
                            {hasClashes && (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                                    <div className="flex items-center gap-2 text-amber-800 font-bold">
                                        <AlertTriangle className="h-5 w-5" />
                                        <h4>Potential Date Clashes Detected</h4>
                                    </div>
                                    <div className="space-y-4">
                                        {Object.entries(clashes).map(([date, clashingProgs]) => (
                                            <div key={date} className="pl-4 border-l-2 border-amber-300">
                                                <p className="font-semibold text-amber-900 mb-2">{format(parseISO(date), "EEEE, MMMM do, yyyy")}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {clashingProgs.map(cp => (
                                                        <div key={cp.id} className="text-xs bg-white border border-amber-200 p-2 rounded shadow-sm">
                                                            <strong>{cp.title}</strong>
                                                            <div className="text-muted-foreground mt-1">By: {cp.organizationName}</div>
                                                            <div className="mt-1">{getStatusBadge(cp.status)}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {programmes.map(prog => (
                                    <div key={prog.id} className="p-4 border rounded-lg hover:border-green-300 transition-colors bg-white shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-sm line-clamp-2" title={prog.title}>{prog.title}</h4>
                                            {getStatusBadge(prog.status)}
                                        </div>
                                        <div className="space-y-1 text-xs text-muted-foreground mt-3">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                <span>{format(parseISO(prog.startDate), "MMM do, yyyy")}</span>
                                                {prog.endDate && <span> - {format(parseISO(prog.endDate), "MMM do, yyyy")}</span>}
                                            </div>
                                            <div><strong>Org:</strong> {prog.organizationName} ({prog.jurisdiction})</div>
                                            <div><strong>Target:</strong> {prog.targetAudience}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
            
            {groupedByMonth.length === 0 && (
                <div className="text-center p-12 bg-slate-50 rounded-lg border border-dashed">
                    <p className="text-muted-foreground">No programme submissions found for this year.</p>
                </div>
            )}
        </div>
    )
}

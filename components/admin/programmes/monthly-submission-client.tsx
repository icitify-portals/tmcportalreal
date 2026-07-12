"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CalendarDays, Clock, Edit } from "lucide-react"
import { format, parseISO, isSameDay } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateProgramme } from "@/lib/actions/programmes"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
    const router = useRouter()
    const [rescheduleOpen, setRescheduleOpen] = useState<string | null>(null)
    const [isUpdating, setIsUpdating] = useState(false)

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
                
                // Clash only if same jurisdiction and same date
                if (isSameDay(parseISO(p1.startDate), parseISO(p2.startDate))) {
                    if (p1.jurisdiction === p2.jurisdiction) {
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

    const handleReschedule = async (e: React.FormEvent<HTMLFormElement>, programmeId: string) => {
        e.preventDefault()
        setIsUpdating(true)
        try {
            const formData = new FormData(e.currentTarget)
            const newStartDate = formData.get("startDate") as string
            const newEndDate = formData.get("endDate") as string
            
            const payload: any = { startDate: newStartDate }
            if (newEndDate) payload.endDate = newEndDate

            const result = await updateProgramme(programmeId, payload)
            if (result.success !== false) { // updateProgramme might not return {success: true} consistently, just check it didn't fail explicitly
                toast.success("Programme rescheduled successfully")
                setRescheduleOpen(null)
                router.refresh()
            } else {
                toast.error(result.error || "Failed to reschedule")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsUpdating(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <Badge className="bg-emerald-500">Approved</Badge>
            case 'PENDING_STATE':
            case 'PENDING_NATIONAL': return <Badge variant="outline" className="text-amber-600 border-amber-600">Pending</Badge>
            case 'REJECTED': return <Badge variant="destructive">Rejected</Badge>
            case 'COMPLETED': return <Badge className="bg-blue-500">Completed</Badge>
            default: return <Badge variant="secondary">{status}</Badge>
        }
    }

    return (
        <div className="space-y-8">
            {groupedByMonth.map(([month, programmes]) => {
                const clashes = getClashes(programmes)
                const hasClashes = Object.keys(clashes).length > 0
                
                // Analytics stats
                const total = programmes.length
                const completed = programmes.filter(p => p.status === 'COMPLETED').length
                const pending = programmes.filter(p => p.status.includes('PENDING')).length

                return (
                    <Card key={month} className={hasClashes ? "border-amber-200" : ""}>
                        <CardHeader className="bg-slate-50/50 border-b pb-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="h-5 w-5 text-green-700" />
                                    <CardTitle className="text-xl text-green-950 font-bold">{month}</CardTitle>
                                </div>
                                <div className="flex flex-wrap gap-2 text-sm font-medium">
                                    <div className="bg-white border px-3 py-1 rounded-md text-gray-900 shadow-sm">Total: {total}</div>
                                    <div className="bg-blue-50 border border-blue-200 px-3 py-1 rounded-md text-blue-900 shadow-sm">Completed: {completed}</div>
                                    <div className="bg-amber-50 border border-amber-200 px-3 py-1 rounded-md text-amber-900 shadow-sm">Pending: {pending}</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            
                            {hasClashes && (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                                    <div className="flex items-center gap-2 text-amber-900 font-bold">
                                        <AlertTriangle className="h-5 w-5" />
                                        <h4>Potential Date Clashes Detected</h4>
                                    </div>
                                    <div className="space-y-4">
                                        {Object.entries(clashes).map(([date, clashingProgs]) => (
                                            <div key={date} className="pl-4 border-l-2 border-amber-400">
                                                <p className="font-bold text-amber-950 mb-2">{format(parseISO(date), "EEEE, MMMM do, yyyy")}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {clashingProgs.map(cp => (
                                                        <div key={cp.id} className="text-xs bg-white border border-amber-300 p-2 rounded shadow-sm text-gray-900">
                                                            <strong>{cp.title}</strong>
                                                            <div className="text-gray-700 mt-1">By: {cp.organizationName}</div>
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
                                    <div key={prog.id} className="p-4 border rounded-lg hover:border-green-300 transition-colors bg-white shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2 gap-2">
                                                <h4 className="font-bold text-gray-950 text-sm line-clamp-2" title={prog.title}>{prog.title}</h4>
                                                <div>{getStatusBadge(prog.status)}</div>
                                            </div>
                                            <div className="space-y-1 text-xs text-gray-800 mt-3">
                                                <div className="flex items-center gap-1 font-medium text-gray-900">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{format(parseISO(prog.startDate), "MMM do, yyyy")}</span>
                                                    {prog.endDate && <span> - {format(parseISO(prog.endDate), "MMM do, yyyy")}</span>}
                                                </div>
                                                <div><strong>Org:</strong> {prog.organizationName} ({prog.jurisdiction})</div>
                                                <div><strong>Target:</strong> {prog.targetAudience}</div>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-3 border-t flex justify-end">
                                            <Dialog open={rescheduleOpen === prog.id} onOpenChange={(open) => setRescheduleOpen(open ? prog.id : null)}>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm" className="h-8 gap-1 text-gray-900 font-medium">
                                                        <Edit className="h-3.5 w-3.5" />
                                                        Reschedule
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Reschedule Programme</DialogTitle>
                                                    </DialogHeader>
                                                    <form onSubmit={(e) => handleReschedule(e, prog.id)} className="space-y-4 py-4">
                                                        <div className="space-y-2">
                                                            <Label>Start Date</Label>
                                                            <Input 
                                                                type="date" 
                                                                name="startDate" 
                                                                defaultValue={prog.startDate.split('T')[0]} 
                                                                required 
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>End Date (Optional)</Label>
                                                            <Input 
                                                                type="date" 
                                                                name="endDate" 
                                                                defaultValue={prog.endDate ? prog.endDate.split('T')[0] : ''} 
                                                            />
                                                        </div>
                                                        <div className="flex justify-end pt-4">
                                                            <Button type="submit" disabled={isUpdating}>
                                                                {isUpdating ? "Saving..." : "Save Changes"}
                                                            </Button>
                                                        </div>
                                                    </form>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
            
            {groupedByMonth.length === 0 && (
                <div className="text-center p-12 bg-slate-50 rounded-lg border border-dashed text-gray-900">
                    <p className="font-medium">No programme submissions found for this year.</p>
                </div>
            )}
        </div>
    )
}

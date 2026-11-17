"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
    Calendar, 
    Clock, 
    Plus, 
    Trash2, 
    Radio, 
    Loader2, 
    ArrowLeft, 
    CheckCircle2, 
    Sparkles, 
    Eye, 
    Utensils, 
    User, 
    MapPin 
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { 
    getProgrammeScheduleTimeline, 
    createProgrammeScheduleItem, 
    deleteProgrammeScheduleItem, 
    setSessionAsCurrent,
    updateNextActionTicker
} from "@/lib/actions/programme-camp-ops"

export default function AdminProgrammeSchedulePage() {
    const params = useParams()
    const id = params.id as string

    const [programme, setProgramme] = useState<any>(null)
    const [schedules, setSchedules] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Ticker state
    const [ticker, setTicker] = useState("")
    const [savingTicker, setSavingTicker] = useState(false)

    // New Session Form state
    const [showAddForm, setShowAddForm] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [dayNumber, setDayNumber] = useState(1)
    const [date, setDate] = useState("")
    const [startTime, setStartTime] = useState("")
    const [endTime, setEndTime] = useState("")
    const [title, setTitle] = useState("")
    const [speaker, setSpeaker] = useState("")
    const [venue, setVenue] = useState("")
    const [category, setCategory] = useState("LECTURE")
    const [description, setDescription] = useState("")

    const loadData = async () => {
        setLoading(true)
        const res = await getProgrammeScheduleTimeline(id)
        if (res.success && res.programme) {
            setProgramme(res.programme)
            setSchedules(res.schedules || [])
            setTicker(res.programme.nextActionTicker || "")
        }
        setLoading(false)
    }

    useEffect(() => {
        if (id) loadData()
    }, [id])

    async function handleSaveTicker(e: React.FormEvent) {
        e.preventDefault()
        setSavingTicker(true)
        try {
            const res = await updateNextActionTicker(id, ticker)
            if (res.success) {
                toast.success("Next Line of Action ticker updated and live for all delegates!")
            } else {
                toast.error(res.error || "Failed to update ticker")
            }
        } catch (err) {
            toast.error("Error saving ticker")
        } finally {
            setSavingTicker(false)
        }
    }

    async function handleAddSession(e: React.FormEvent) {
        e.preventDefault()
        if (!title.trim() || !startTime.trim()) {
            toast.error("Title and Start Time are required")
            return
        }

        setIsSaving(true)
        try {
            const res = await createProgrammeScheduleItem({
                programmeId: id,
                dayNumber,
                date,
                startTime,
                endTime,
                title,
                speaker,
                venue,
                category,
                description,
            })

            if (res.success) {
                toast.success("Schedule session added successfully")
                setShowAddForm(false)
                setTitle("")
                setSpeaker("")
                setDescription("")
                loadData()
            } else {
                toast.error(res.error || "Failed to add session")
            }
        } catch (err) {
            toast.error("Error adding session")
        } finally {
            setIsSaving(false)
        }
    }

    async function handleSetCurrent(scheduleId: string) {
        try {
            const res = await setSessionAsCurrent(scheduleId, id)
            if (res.success) {
                toast.success("Session marked as NOW HAPPENING!")
                loadData()
            } else {
                toast.error(res.error || "Failed to set active session")
            }
        } catch (err) {
            toast.error("Error setting session")
        }
    }

    async function handleDelete(scheduleId: string) {
        if (!confirm("Are you sure you want to delete this schedule session?")) return
        try {
            const res = await deleteProgrammeScheduleItem(scheduleId, id)
            if (res.success) {
                toast.success("Session deleted")
                loadData()
            } else {
                toast.error(res.error || "Failed to delete")
            }
        } catch (err) {
            toast.error("Error deleting session")
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
                {/* Header Navigation */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Link 
                            href={`/dashboard/admin/programmes`}
                            className="inline-flex items-center text-xs font-bold text-emerald-700 hover:text-emerald-800 mb-1"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Programmes
                        </Link>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Programme Schedule & Event Tracker</h1>
                        <p className="text-sm text-gray-500 font-medium">{programme?.title}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild className="border-amber-200 text-amber-800">
                            <Link href={`/dashboard/admin/programmes/${id}/meals`}>
                                <Utensils className="w-4 h-4 mr-1.5" /> Food Timetable
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="border-emerald-200 text-emerald-800">
                            <Link href={`/dashboard/admin/programmes/${id}/as-i-see-it`}>
                                <Eye className="w-4 h-4 mr-1.5" /> As I See It Box
                            </Link>
                        </Button>
                        <Button size="sm" asChild className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold">
                            <Link href={`/programmes/${id}/schedule`} target="_blank">
                                View Live Delegate Schedule ↗
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Next Action Ticker Broadcast Card */}
                <Card className="border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/50 to-white shadow-xs">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
                                <CardTitle className="text-base font-bold text-emerald-950">
                                    Next Line of Action (Live Delegate Broadcast Ticker)
                                </CardTitle>
                            </div>
                            <Badge className="bg-emerald-600 text-white text-[10px] uppercase font-bold">
                                Instant Sync
                            </Badge>
                        </div>
                        <CardDescription className="text-xs">
                            This banner is highlighted live at the top of every delegate&apos;s mobile schedule, food timetable, and access slip.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSaveTicker} className="flex gap-2">
                            <Input 
                                value={ticker}
                                onChange={(e) => setTicker(e.target.value)}
                                placeholder="e.g. Next: Asr prayer at Main Mosque (4:15 PM), followed by Workshop 2"
                                className="font-semibold text-sm h-11 bg-white"
                            />
                            <Button 
                                type="submit" 
                                disabled={savingTicker}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-11 shrink-0"
                            >
                                {savingTicker ? <Loader2 className="w-4 h-4 animate-spin" /> : "Broadcast Ticker"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Add Session Button */}
                <div className="flex justify-between items-center pt-2">
                    <h2 className="text-lg font-bold text-gray-900">Event Timetable Sessions ({schedules.length})</h2>
                    <Button 
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="bg-green-700 hover:bg-green-800 text-white font-bold text-xs rounded-xl"
                    >
                        <Plus className="w-4 h-4 mr-1.5" /> Add Schedule Session
                    </Button>
                </div>

                {/* Add Session Drawer/Form */}
                {showAddForm && (
                    <Card className="border-2 border-green-600/30 bg-green-50/20 shadow-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold text-gray-900">Add New Agenda Session</CardTitle>
                        </CardHeader>
                        <form onSubmit={handleAddSession}>
                            <CardContent className="space-y-4 text-sm">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <Label className="text-xs font-bold">Day Number</Label>
                                        <Input 
                                            type="number" 
                                            min={1} 
                                            value={dayNumber} 
                                            onChange={(e) => setDayNumber(Number(e.target.value))} 
                                            required 
                                            className="bg-white"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-bold">Start Time</Label>
                                        <Input 
                                            value={startTime} 
                                            onChange={(e) => setStartTime(e.target.value)} 
                                            placeholder="e.g. 09:00 AM" 
                                            required 
                                            className="bg-white"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-bold">End Time (Optional)</Label>
                                        <Input 
                                            value={endTime} 
                                            onChange={(e) => setEndTime(e.target.value)} 
                                            placeholder="e.g. 11:00 AM" 
                                            className="bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs font-bold">Session Title</Label>
                                        <Input 
                                            value={title} 
                                            onChange={(e) => setTitle(e.target.value)} 
                                            placeholder="e.g. Keynote Address / Opening Plenary" 
                                            required 
                                            className="bg-white font-semibold"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-bold">Speaker / Facilitator (Optional)</Label>
                                        <Input 
                                            value={speaker} 
                                            onChange={(e) => setSpeaker(e.target.value)} 
                                            placeholder="e.g. Dr. AbdulHakeem" 
                                            className="bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs font-bold">Category</Label>
                                        <select 
                                            value={category} 
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full h-10 border rounded-md px-3 bg-white text-xs font-bold"
                                        >
                                            <option value="LECTURE">Lecture / Plenary</option>
                                            <option value="WORKSHOP">Workshop</option>
                                            <option value="PRAYER">Prayer / Dhikr</option>
                                            <option value="MEAL">Meal</option>
                                            <option value="SPORT">Sport / Drill</option>
                                            <option value="BREAK">Break / Rest</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label className="text-xs font-bold">Venue / Hall (Optional)</Label>
                                        <Input 
                                            value={venue} 
                                            onChange={(e) => setVenue(e.target.value)} 
                                            placeholder="e.g. Main Auditorium" 
                                            className="bg-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Description / Notes (Optional)</Label>
                                    <Textarea 
                                        rows={2} 
                                        value={description} 
                                        onChange={(e) => setDescription(e.target.value)} 
                                        placeholder="Synopsis of lecture, recommended materials, or delegate requirements..." 
                                        className="bg-white text-xs"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" size="sm" disabled={isSaving} className="bg-green-700 hover:bg-green-800 text-white font-bold">
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Session"}
                                    </Button>
                                </div>
                            </CardContent>
                        </form>
                    </Card>
                )}

                {/* Sessions Table */}
                <div className="space-y-3">
                    {schedules.map((session) => (
                        <Card key={session.id} className={`border transition-all ${session.isCurrentSession ? 'border-emerald-500 bg-emerald-50/20 shadow-md' : 'border-gray-200 bg-white'}`}>
                            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="font-bold text-[10px]">
                                            Day {session.dayNumber}
                                        </Badge>
                                        <span className="text-xs font-mono font-bold text-gray-700">
                                            {session.startTime} {session.endTime ? `– ${session.endTime}` : ""}
                                        </span>
                                        <Badge className="text-[10px] bg-gray-100 text-gray-800">
                                            {session.category}
                                        </Badge>
                                        {session.isCurrentSession && (
                                            <Badge className="bg-emerald-600 text-white text-[10px] font-bold uppercase animate-pulse">
                                                ★ Live Now
                                            </Badge>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-base text-gray-900">{session.title}</h3>
                                    {(session.speaker || session.venue) && (
                                        <p className="text-xs text-gray-500 font-medium flex items-center gap-3">
                                            {session.speaker && <span>Speaker: <b>{session.speaker}</b></span>}
                                            {session.venue && <span>Venue: <b>{session.venue}</b></span>}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                    {!session.isCurrentSession && (
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            onClick={() => handleSetCurrent(session.id)}
                                            className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-bold"
                                        >
                                            <Radio className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                            Set Live Now
                                        </Button>
                                    )}
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={() => handleDelete(session.id)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    )
}

"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
    Eye, 
    ArrowLeft, 
    AlertTriangle, 
    CheckCircle2, 
    Clock, 
    Flag, 
    Loader2, 
    Filter, 
    Sparkles, 
    User,
    Calendar,
    Share2,
    Utensils,
    FileText
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { getCampObservations, updateCampObservationStatus } from "@/lib/actions/programme-camp-ops"

export default function AdminCampObservationsPage() {
    const params = useParams()
    const id = params.id as string

    const [observations, setObservations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
    const [selectedStatus, setSelectedStatus] = useState<string>("ALL")

    // Triage modal
    const [editingObs, setEditingObs] = useState<any | null>(null)
    const [adminNotes, setAdminNotes] = useState("")
    const [actionTaken, setActionTaken] = useState("")
    const [triageStatus, setTriageStatus] = useState<any>("PENDING")
    const [isSaving, setIsSaving] = useState(false)

    const loadData = async () => {
        setLoading(true)
        const res = await getCampObservations(id)
        if (res.success) {
            setObservations(res.data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        if (id) loadData()
    }, [id])

    const filtered = observations.filter(o => {
        if (selectedCategory !== "ALL" && o.category !== selectedCategory) return false
        if (selectedStatus !== "ALL" && o.status !== selectedStatus) return false
        return true
    })

    const flaggedForFinalDay = observations.filter(o => o.status === "FLAGGED_FOR_FINAL_DAY")
    const pendingCount = observations.filter(o => o.status === "PENDING").length
    const resolvedCount = observations.filter(o => o.status === "RESOLVED").length

    async function handleSaveTriage(e: React.FormEvent) {
        e.preventDefault()
        if (!editingObs) return

        setIsSaving(true)
        try {
            const res = await updateCampObservationStatus(editingObs.id, id, {
                status: triageStatus,
                adminNotes: adminNotes.trim(),
                actionTaken: actionTaken.trim(),
            })

            if (res.success) {
                toast.success("Observation status updated")
                setEditingObs(null)
                loadData()
            } else {
                toast.error(res.error || "Failed to update")
            }
        } catch (err) {
            toast.error("Error updating triage")
        } finally {
            setIsSaving(false)
        }
    }

    const getCategoryBadge = (cat: string) => {
        switch (cat) {
            case "SANITATION": return <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200">🚽 Sanitation</Badge>
            case "SECURITY": return <Badge className="bg-red-100 text-red-800 border-red-200">🛡️ Security</Badge>
            case "WELFARE": return <Badge className="bg-amber-100 text-amber-800 border-amber-200">🍲 Welfare</Badge>
            case "ACCOMMODATION": return <Badge className="bg-purple-100 text-purple-800 border-purple-200">🛏️ Hostels</Badge>
            case "LECTURES": return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">📖 Lectures</Badge>
            case "AUDIO_VISUAL": return <Badge className="bg-blue-100 text-blue-800 border-blue-200">🔊 Sound/AV</Badge>
            case "MEDICAL": return <Badge className="bg-rose-100 text-rose-800 border-rose-200">🏥 Medical</Badge>
            default: return <Badge className="bg-gray-100 text-gray-800 border-gray-200">💡 General</Badge>
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "RESOLVED":
                return <Badge className="bg-emerald-600 text-white font-bold text-[10px]">✓ Resolved</Badge>
            case "INVESTIGATING":
                return <Badge className="bg-blue-600 text-white font-bold text-[10px]">⚙ Investigating</Badge>
            case "FLAGGED_FOR_FINAL_DAY":
                return <Badge className="bg-purple-700 text-white font-bold text-[10px] flex items-center gap-1">🚩 Final Day Review</Badge>
            default:
                return <Badge variant="outline" className="text-amber-800 border-amber-300 bg-amber-50 font-bold text-[10px]">● Pending</Badge>
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
            <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Link 
                            href={`/dashboard/admin/programmes`}
                            className="inline-flex items-center text-xs font-bold text-emerald-700 hover:text-emerald-800 mb-1"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Programmes
                        </Link>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">AS I SEE IT — Leadership Command Center</h1>
                        <p className="text-sm text-gray-500 font-medium">Real-time delegate observations, ground intelligence & final day review</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild className="border-emerald-200 text-emerald-800">
                            <Link href={`/dashboard/admin/programmes/${id}/schedule`}>
                                Event Schedule
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="border-amber-200 text-amber-800">
                            <Link href={`/dashboard/admin/programmes/${id}/meals`}>
                                Food Timetable
                            </Link>
                        </Button>
                        <Button size="sm" asChild className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold">
                            <Link href={`/programmes/${id}/as-i-see-it`} target="_blank">
                                Open Delegate Submission Box ↗
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* KPI Metrics Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <Card className="border border-gray-200 bg-white">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Submissions</CardDescription>
                            <CardTitle className="text-3xl font-black text-gray-900">{observations.length}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="border border-amber-200 bg-amber-50/30">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Triage</CardDescription>
                            <CardTitle className="text-3xl font-black text-amber-900">{pendingCount}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="border border-emerald-200 bg-emerald-50/30">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-bold uppercase tracking-wider text-emerald-700">Resolved During Camp</CardDescription>
                            <CardTitle className="text-3xl font-black text-emerald-900">{resolvedCount}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="border border-purple-200 bg-purple-50/40">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-bold uppercase tracking-wider text-purple-700">Final Day Review List</CardDescription>
                            <CardTitle className="text-3xl font-black text-purple-900 flex items-center gap-1.5">
                                <Flag className="w-6 h-6 text-purple-600 fill-purple-600" />
                                {flaggedForFinalDay.length}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-gray-500 flex items-center gap-1 mr-1">
                            <Filter className="w-3.5 h-3.5" /> Filter Category:
                        </span>
                        {["ALL", "SANITATION", "SECURITY", "WELFARE", "ACCOMMODATION", "LECTURES", "AUDIO_VISUAL", "MEDICAL", "GENERAL"].map(cat => (
                            <Button
                                key={cat}
                                size="sm"
                                variant={selectedCategory === cat ? "default" : "outline"}
                                onClick={() => setSelectedCategory(cat)}
                                className={`text-[11px] h-7 rounded-full font-bold ${
                                    selectedCategory === cat ? "bg-emerald-700 text-white" : "border-gray-200"
                                }`}
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="text-xs font-bold p-1.5 border rounded-lg bg-gray-50"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="PENDING">Pending Only</option>
                            <option value="INVESTIGATING">Investigating</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="FLAGGED_FOR_FINAL_DAY">🚩 Flagged for Final Day</option>
                        </select>
                    </div>
                </div>

                {/* Observations Stream */}
                <div className="space-y-4">
                    {filtered.length === 0 ? (
                        <Card className="text-center py-16 border-dashed">
                            <CardContent className="space-y-2">
                                <Eye className="w-12 h-12 text-gray-300 mx-auto" />
                                <p className="text-gray-500 font-medium">No observations match your current filter.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filtered.map(obs => (
                            <Card key={obs.id} className="border border-gray-200 hover:shadow-xs transition-shadow bg-white">
                                <CardContent className="p-5 space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            {getCategoryBadge(obs.category)}
                                            {obs.urgency === "URGENT" && (
                                                <Badge className="bg-rose-600 text-white font-black text-[10px] animate-pulse">
                                                    URGENT
                                                </Badge>
                                            )}
                                            <span className="text-xs text-gray-400 font-mono">
                                                {new Date(obs.createdAt).toLocaleString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <div>
                                            {getStatusBadge(obs.status)}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-base font-bold text-gray-900">{obs.title}</h3>
                                        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{obs.description}</p>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                                        <span className="font-semibold text-gray-600">
                                            Submitted by: <b>{obs.submitterName || "Anonymous"}</b>
                                        </span>

                                        <div className="flex items-center gap-2">
                                            <Button 
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setEditingObs(obs)
                                                    setAdminNotes(obs.adminNotes || "")
                                                    setActionTaken(obs.actionTaken || "")
                                                    setTriageStatus(obs.status || "PENDING")
                                                }}
                                                className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-bold"
                                            >
                                                Triage / Take Action
                                            </Button>
                                        </div>
                                    </div>

                                    {(obs.adminNotes || obs.actionTaken) && (
                                        <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-xs space-y-1">
                                            {obs.actionTaken && <p><b>Action Taken:</b> {obs.actionTaken}</p>}
                                            {obs.adminNotes && <p className="text-gray-600"><b>Leadership Note:</b> {obs.adminNotes}</p>}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Triage Modal */}
                {editingObs && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <Card className="w-full max-w-lg bg-white shadow-2xl rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <CardHeader className="bg-emerald-50 border-b border-emerald-100 pb-4">
                                <CardTitle className="text-lg font-bold text-gray-900">
                                    Triage Camp Observation
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {editingObs.title}
                                </CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSaveTriage}>
                                <CardContent className="p-6 space-y-4 text-sm">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold">Observation Status</Label>
                                        <select
                                            value={triageStatus}
                                            onChange={(e) => setTriageStatus(e.target.value)}
                                            className="w-full h-10 border rounded-xl px-3 bg-white text-xs font-bold"
                                        >
                                            <option value="PENDING">Pending (Under review)</option>
                                            <option value="INVESTIGATING">Investigating (Dispatched team)</option>
                                            <option value="RESOLVED">Resolved (Issue fixed on ground)</option>
                                            <option value="FLAGGED_FOR_FINAL_DAY">🚩 Flag for Final Day Leadership Plenary</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold">Action Taken / Dispatched Response</Label>
                                        <Input 
                                            value={actionTaken}
                                            onChange={(e) => setActionTaken(e.target.value)}
                                            placeholder="e.g. Plumber dispatched to Hostel B, pump restored"
                                            className="text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold">Leadership / Admin Internal Note</Label>
                                        <Textarea 
                                            rows={3}
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            placeholder="Notes for camp leadership report or final day review speech..."
                                            className="text-xs"
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-gray-50 p-4 border-t flex justify-end gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setEditingObs(null)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" size="sm" disabled={isSaving} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold">
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}

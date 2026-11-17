"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
    Award, 
    ArrowLeft, 
    Star, 
    FileText, 
    CheckCircle2, 
    AlertTriangle, 
    Plus, 
    Search, 
    Edit, 
    Save, 
    Building2, 
    Calendar, 
    Users, 
    TrendingUp, 
    ExternalLink,
    Lock,
    Clock,
    Paperclip
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { 
    getProgrammeDepartmentKPIOverview, 
    saveDepartmentReview, 
    getDepartmentActivityLogs, 
    createDepartmentActivityLog 
} from "@/lib/actions/programme-camp-ops"

export default function AdminDepartmentKPIAndNotesPage() {
    const params = useParams()
    const id = params.id as string

    const [activeTab, setActiveTab] = useState<"KPI" | "NOTES">("KPI")
    const [overview, setOverview] = useState<any[]>([])
    const [activityLogs, setActivityLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Committee Review Modal
    const [reviewingItem, setReviewingItem] = useState<any | null>(null)
    const [reviewingCommitteeName, setReviewingCommitteeName] = useState("Central Working Committee")
    const [committeeScore, setCommitteeScore] = useState("80")
    const [performanceTier, setPerformanceTier] = useState("EXCELLENT")
    const [strengths, setStrengths] = useState("")
    const [weaknesses, setWeaknesses] = useState("")
    const [recommendations, setRecommendations] = useState("")
    const [reviewStatus, setReviewStatus] = useState("FINALIZED")
    const [isSavingReview, setIsSavingReview] = useState(false)

    // Activity Log Modal
    const [showLogModal, setShowLogModal] = useState(false)
    const [selectedDeptId, setSelectedDeptId] = useState("")
    const [logTitle, setLogTitle] = useState("")
    const [activityType, setActivityType] = useState("DAILY_LOG")
    const [officerInCharge, setOfficerInCharge] = useState("")
    const [summary, setSummary] = useState("")
    const [actionItems, setActionItems] = useState("")
    const [challenges, setChallenges] = useState("")
    const [attachmentsUrl, setAttachmentsUrl] = useState("")
    const [isSavingLog, setIsSavingLog] = useState(false)

    const loadData = async () => {
        setLoading(true)
        const [overviewRes, logsRes] = await Promise.all([
            getProgrammeDepartmentKPIOverview(id),
            getDepartmentActivityLogs(id)
        ])

        if (overviewRes.success) setOverview(overviewRes.data)
        if (logsRes.success) setActivityLogs(logsRes.data)
        setLoading(false)
    }

    useEffect(() => {
        if (id) loadData()
    }, [id])

    const openReviewModal = (item: any) => {
        setReviewingItem(item)
        setReviewingCommitteeName(item.review?.reviewingCommitteeName || "Central Working Committee")
        setCommitteeScore(item.review?.committeeScore ? String(item.review.committeeScore) : "80")
        setPerformanceTier(item.review?.performanceTier || "EXCELLENT")
        setStrengths(item.review?.strengths || "")
        setWeaknesses(item.review?.weaknesses || "")
        setRecommendations(item.review?.actionableRecommendations || "")
        setReviewStatus(item.review?.status || "FINALIZED")
    }

    const handleSaveReview = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!reviewingItem) return

        setIsSavingReview(true)
        const res = await saveDepartmentReview({
            programmeId: id,
            departmentId: reviewingItem.department.id,
            reviewingCommitteeName,
            committeeScore: parseFloat(committeeScore || "0"),
            performanceTier,
            strengths,
            weaknesses,
            actionableRecommendations: recommendations,
            status: reviewStatus,
        })

        if (res.success) {
            toast.success(`KPI assessment for ${reviewingItem.department.name} saved!`)
            setReviewingItem(null)
            loadData()
        } else {
            toast.error(res.error || "Failed to save review")
        }
        setIsSavingReview(false)
    }

    const handleCreateLog = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedDeptId || !logTitle.trim() || !summary.trim()) {
            toast.error("Please fill in department, title, and summary")
            return
        }

        setIsSavingLog(true)
        const res = await createDepartmentActivityLog({
            programmeId: id,
            departmentId: selectedDeptId,
            title: logTitle,
            activityType,
            officerInCharge,
            summary,
            actionItems,
            challengesEncountered: challenges,
            attachmentsUrl,
        })

        if (res.success) {
            toast.success("Department activity log saved!")
            setShowLogModal(false)
            setLogTitle("")
            setSummary("")
            setActionItems("")
            setChallenges("")
            setAttachmentsUrl("")
            loadData()
        } else {
            toast.error(res.error || "Failed to save activity log")
        }
        setIsSavingLog(false)
    }

    const filteredOverview = overview.filter(item => 
        item.department.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.code.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredLogs = activityLogs.filter(log => 
        log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.departmentName && log.departmentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        log.summary.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
                    <div className="flex items-center gap-3">
                        <Link href={`/dashboard/admin/programmes`}>
                            <Button variant="ghost" size="icon" className="rounded-xl">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Departmental KPI & Operations Hub</h1>
                                <Badge className="bg-indigo-600 text-white font-bold text-xs">Quality Assurance</Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Track delegate ratings, supervisory committee grading, and departmental activity notes.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href={`/programmes/${id}/departments/assess`} target="_blank">
                            <Button variant="outline" className="rounded-xl text-xs font-semibold gap-1.5">
                                <ExternalLink className="w-3.5 h-3.5" /> Delegate Rating Page
                            </Button>
                        </Link>
                        <Button 
                            onClick={() => {
                                if (overview.length > 0) setSelectedDeptId(overview[0].department.id)
                                setShowLogModal(true)
                            }}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl gap-1.5 text-xs shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Add Activity Log / Minutes
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b">
                    <button
                        onClick={() => setActiveTab("KPI")}
                        className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                            activeTab === "KPI" 
                                ? "border-emerald-600 text-emerald-800" 
                                : "border-transparent text-gray-500 hover:text-gray-900"
                        }`}
                    >
                        <Award className="w-4 h-4" /> Departmental KPI Overview ({overview.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("NOTES")}
                        className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                            activeTab === "NOTES" 
                                ? "border-emerald-600 text-emerald-800" 
                                : "border-transparent text-gray-500 hover:text-gray-900"
                        }`}
                    >
                        <FileText className="w-4 h-4" /> Documentation & Activity Notes ({activityLogs.length})
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search departments or notes..."
                        className="pl-9 h-9 text-xs rounded-xl"
                    />
                </div>

                {/* TAB 1: KPI OVERVIEW */}
                {activeTab === "KPI" && (
                    <div className="space-y-4">
                        {loading ? (
                            <div className="bg-white rounded-2xl p-12 text-center text-gray-400 text-xs">
                                Loading departmental performance records...
                            </div>
                        ) : filteredOverview.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-dashed p-12 text-center space-y-2 text-gray-500 text-xs">
                                No departments found
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredOverview.map(item => {
                                    const { department, assessmentCount, avgOverall, review, activityLogCount } = item
                                    const hasFinalReview = review && review.status === "FINALIZED"
                                    return (
                                        <Card key={department.id} className="rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden bg-white">
                                            <CardContent className="p-5 space-y-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-black font-mono rounded-md mb-1">
                                                            {department.code}
                                                        </span>
                                                        <h3 className="text-base font-black text-gray-900 leading-snug">{department.name}</h3>
                                                        <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{department.description}</p>
                                                    </div>
                                                    {hasFinalReview ? (
                                                        <Badge className="bg-emerald-100 text-emerald-800 font-black text-[10px] shrink-0">
                                                            {review.performanceTier}
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-amber-100 text-amber-800 font-bold text-[10px] shrink-0">
                                                            Pending Review
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Scores Matrix */}
                                                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                                                    <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100 text-center">
                                                        <p className="text-[10px] uppercase font-bold text-amber-800">Delegate Score</p>
                                                        <div className="text-lg font-black text-amber-900 flex items-center justify-center gap-1 mt-0.5">
                                                            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                                            {avgOverall > 0 ? avgOverall : "—"} / 5
                                                        </div>
                                                        <p className="text-[10px] text-gray-500">{assessmentCount} evaluation{assessmentCount === 1 ? '' : 's'}</p>
                                                    </div>

                                                    <div className="bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100 text-center">
                                                        <p className="text-[10px] uppercase font-bold text-indigo-800">Final Weighted</p>
                                                        <div className="text-lg font-black text-indigo-900 mt-0.5">
                                                            {hasFinalReview ? `${review.finalWeightedScore}%` : "Pending"}
                                                        </div>
                                                        <p className="text-[10px] text-gray-500">
                                                            {hasFinalReview ? `Comm: ${review.committeeScore}%` : "Supervisory grading"}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Review summary preview */}
                                                {review?.actionableRecommendations && (
                                                    <p className="text-[11px] text-gray-600 italic bg-gray-50 p-2 rounded-xl line-clamp-2">
                                                        "Rec: {review.actionableRecommendations}"
                                                    </p>
                                                )}
                                            </CardContent>

                                            <div className="p-3 bg-gray-50/80 border-t flex items-center justify-between text-xs">
                                                <span className="text-[11px] text-gray-500 flex items-center gap-1 font-medium">
                                                    <FileText className="w-3.5 h-3.5 text-gray-400" /> {activityLogCount} Activity Log{activityLogCount === 1 ? '' : 's'}
                                                </span>

                                                <Button 
                                                    size="sm"
                                                    onClick={() => openReviewModal(item)}
                                                    className="h-8 px-3 text-xs rounded-xl font-bold bg-indigo-700 hover:bg-indigo-800 text-white"
                                                >
                                                    <Edit className="w-3.5 h-3.5 mr-1" /> 
                                                    {hasFinalReview ? "Update KPI Review" : "Finalize KPI"}
                                                </Button>
                                            </div>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: ACTIVITY NOTES & DOCUMENTATION */}
                {activeTab === "NOTES" && (
                    <div className="space-y-4">
                        {filteredLogs.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-dashed p-12 text-center space-y-3">
                                <FileText className="w-10 h-10 text-gray-300 mx-auto" />
                                <p className="text-sm font-semibold text-gray-700">No departmental activity logs yet</p>
                                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                                    Document meeting minutes, daily logs, water/light incidents, and clinic records for comprehensive camp reporting.
                                </p>
                                <Button 
                                    onClick={() => {
                                        if (overview.length > 0) setSelectedDeptId(overview[0].department.id)
                                        setShowLogModal(true)
                                    }}
                                    size="sm"
                                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs mt-2"
                                >
                                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Create First Activity Log
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredLogs.map(log => (
                                    <Card key={log.id} className="rounded-2xl border border-gray-200/90 shadow-xs bg-white overflow-hidden">
                                        <CardContent className="p-5 space-y-3">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge className="bg-gray-100 text-gray-800 font-mono text-[10px] font-bold">
                                                        {log.departmentName || "General Directorate"}
                                                    </Badge>
                                                    <Badge className="bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                                                        {log.activityType.replace('_', ' ')}
                                                    </Badge>
                                                    <h3 className="text-base font-black text-gray-900">{log.title}</h3>
                                                </div>
                                                <div className="text-[11px] text-gray-500 font-medium">
                                                    {new Date(log.activityDate).toLocaleString()} • Officer: <strong className="text-gray-700">{log.officerInCharge || "Duty Officer"}</strong>
                                                </div>
                                            </div>

                                            <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                {log.summary}
                                            </div>

                                            {(log.actionItems || log.challengesEncountered) && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                                    {log.actionItems && (
                                                        <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs">
                                                            <p className="font-bold text-emerald-900 mb-0.5">Action Items & Decisions:</p>
                                                            <p className="text-emerald-800">{log.actionItems}</p>
                                                        </div>
                                                    )}
                                                    {log.challengesEncountered && (
                                                        <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-100 text-xs">
                                                            <p className="font-bold text-amber-900 mb-0.5">Challenges & Bottlenecks:</p>
                                                            <p className="text-amber-800">{log.challengesEncountered}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {log.attachmentsUrl && (
                                                <div className="pt-2">
                                                    <a 
                                                        href={log.attachmentsUrl} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-bold"
                                                    >
                                                        <Paperclip className="w-3.5 h-3.5" /> View Attached Document / Spreadsheet
                                                    </a>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Committee Review & KPI Finalization Modal */}
            {reviewingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-gray-100 my-8">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                                    <Award className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base">Supervisory Committee KPI Review</h3>
                                    <p className="text-xs text-gray-500">{reviewingItem.department.name}</p>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setReviewingItem(null)}
                                className="rounded-full h-8 w-8 p-0"
                            >
                                ✕
                            </Button>
                        </div>

                        {/* Delegate Score Stats Banner */}
                        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between text-xs">
                            <div>
                                <span className="font-bold text-amber-900">Delegate Average Rating:</span>
                                <div className="text-base font-black text-amber-800">
                                    {reviewingItem.avgOverall > 0 ? `${reviewingItem.avgOverall} / 5.00` : "No delegate ratings yet"}
                                </div>
                            </div>
                            <div className="text-right text-[11px] text-amber-700">
                                <div>Efficiency: {reviewingItem.avgEfficiency} / 5</div>
                                <div>Conduct: {reviewingItem.avgConduct} / 5</div>
                            </div>
                        </div>

                        <form onSubmit={handleSaveReview} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Reviewing Committee *</Label>
                                    <Input 
                                        required
                                        value={reviewingCommitteeName}
                                        onChange={(e) => setReviewingCommitteeName(e.target.value)}
                                        placeholder="e.g. Central Working Committee"
                                        className="h-9 text-xs rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Committee Score (0 - 100) *</Label>
                                    <Input 
                                        type="number"
                                        required
                                        min="0"
                                        max="100"
                                        value={committeeScore}
                                        onChange={(e) => setCommitteeScore(e.target.value)}
                                        placeholder="e.g. 85"
                                        className="h-9 text-xs rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Performance Tier *</Label>
                                    <select
                                        value={performanceTier}
                                        onChange={(e) => setPerformanceTier(e.target.value)}
                                        className="w-full h-9 rounded-xl border border-gray-300 bg-white px-3 text-xs focus:ring-2 focus:ring-indigo-500 font-bold"
                                    >
                                        <option value="OUTSTANDING">OUTSTANDING (90% - 100%)</option>
                                        <option value="EXCELLENT">EXCELLENT (80% - 89%)</option>
                                        <option value="SATISFACTORY">SATISFACTORY (65% - 79%)</option>
                                        <option value="NEEDS_IMPROVEMENT">NEEDS IMPROVEMENT (50% - 64%)</option>
                                        <option value="UNACCEPTABLE">UNACCEPTABLE (&lt; 50%)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Review Status *</Label>
                                    <select
                                        value={reviewStatus}
                                        onChange={(e) => setReviewStatus(e.target.value)}
                                        className="w-full h-9 rounded-xl border border-gray-300 bg-white px-3 text-xs focus:ring-2 focus:ring-indigo-500 font-bold"
                                    >
                                        <option value="FINALIZED">FINALIZED (Approved for Plenary)</option>
                                        <option value="DRAFT">DRAFT (Internal Review)</option>
                                    </select>
                                </div>

                                <div className="space-y-1 sm:col-span-2">
                                    <Label className="text-xs font-bold text-gray-700">Key Strengths & Commendations</Label>
                                    <Textarea 
                                        value={strengths}
                                        onChange={(e) => setStrengths(e.target.value)}
                                        placeholder="Notable areas where the department excelled..."
                                        rows={2}
                                        className="text-xs rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1 sm:col-span-2">
                                    <Label className="text-xs font-bold text-gray-700">Observed Weaknesses & Lapses</Label>
                                    <Textarea 
                                        value={weaknesses}
                                        onChange={(e) => setWeaknesses(e.target.value)}
                                        placeholder="Delays, shortage of materials, protocol issues..."
                                        rows={2}
                                        className="text-xs rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1 sm:col-span-2">
                                    <Label className="text-xs font-bold text-gray-700">Actionable Recommendations for Next Camp</Label>
                                    <Textarea 
                                        value={recommendations}
                                        onChange={(e) => setRecommendations(e.target.value)}
                                        placeholder="Key resolutions and mandatory directives for the leadership..."
                                        rows={2}
                                        className="text-xs rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setReviewingItem(null)}
                                    className="rounded-xl text-xs h-9 font-semibold"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={isSavingReview}
                                    className="bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold h-9"
                                >
                                    {isSavingReview ? "Saving..." : "Save & Finalize KPI Assessment"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Activity Log / Minutes Modal */}
            {showLogModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-gray-100 my-8">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base">New Departmental Activity Note</h3>
                                    <p className="text-xs text-gray-500">Record Minutes, Daily Briefs & Incident Logs</p>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setShowLogModal(false)}
                                className="rounded-full h-8 w-8 p-0"
                            >
                                ✕
                            </Button>
                        </div>

                        <form onSubmit={handleCreateLog} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1 sm:col-span-2">
                                    <Label className="text-xs font-bold text-gray-700">Department / Directorate *</Label>
                                    <select
                                        value={selectedDeptId}
                                        onChange={(e) => setSelectedDeptId(e.target.value)}
                                        className="w-full h-9 rounded-xl border border-gray-300 bg-white px-3 text-xs focus:ring-2 focus:ring-emerald-500 font-bold"
                                    >
                                        {overview.map(item => (
                                            <option key={item.department.id} value={item.department.id}>
                                                {item.department.name} ({item.department.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1 sm:col-span-2">
                                    <Label className="text-xs font-bold text-gray-700">Note / Minutes Title *</Label>
                                    <Input 
                                        required
                                        value={logTitle}
                                        onChange={(e) => setLogTitle(e.target.value)}
                                        placeholder="e.g. Day 2 Morning Briefing on Water Flow"
                                        className="h-9 text-xs rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Activity Type *</Label>
                                    <select
                                        value={activityType}
                                        onChange={(e) => setActivityType(e.target.value)}
                                        className="w-full h-9 rounded-xl border border-gray-300 bg-white px-3 text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                                    >
                                        <option value="DAILY_LOG">Daily Activity Log</option>
                                        <option value="MEETING_MINUTES">Meeting Minutes / Briefing</option>
                                        <option value="INCIDENT_REPORT">Incident / Breakdown Report</option>
                                        <option value="HANDOVER_NOTE">Shift Handover Note</option>
                                        <option value="RESOURCE_REQUEST">Urgent Resource Request</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Officer In Charge</Label>
                                    <Input 
                                        value={officerInCharge}
                                        onChange={(e) => setOfficerInCharge(e.target.value)}
                                        placeholder="e.g. Bro. AbdulHakeem (Lead)"
                                        className="h-9 text-xs rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1 sm:col-span-2">
                                    <Label className="text-xs font-bold text-gray-700">Activity Summary & Details *</Label>
                                    <Textarea 
                                        required
                                        value={summary}
                                        onChange={(e) => setSummary(e.target.value)}
                                        placeholder="Record key happenings, decisions made, quantities distributed, patients attended to..."
                                        rows={3}
                                        className="text-xs rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1 sm:col-span-2">
                                    <Label className="text-xs font-bold text-gray-700">Action Items & Next Steps</Label>
                                    <Textarea 
                                        value={actionItems}
                                        onChange={(e) => setActionItems(e.target.value)}
                                        placeholder="Tasks assigned to team members and follow-up deadlines..."
                                        rows={2}
                                        className="text-xs rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1 sm:col-span-2">
                                    <Label className="text-xs font-bold text-gray-700">Bottlenecks & Challenges</Label>
                                    <Textarea 
                                        value={challenges}
                                        onChange={(e) => setChallenges(e.target.value)}
                                        placeholder="Unresolved issues requiring camp directorate intervention..."
                                        rows={2}
                                        className="text-xs rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1 sm:col-span-2">
                                    <Label className="text-xs font-bold text-gray-700">Attachment / Google Drive Link</Label>
                                    <Input 
                                        value={attachmentsUrl}
                                        onChange={(e) => setAttachmentsUrl(e.target.value)}
                                        placeholder="https://drive.google.com/..."
                                        className="h-9 text-xs rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setShowLogModal(false)}
                                    className="rounded-xl text-xs h-9 font-semibold"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={isSavingLog}
                                    className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold h-9"
                                >
                                    {isSavingLog ? "Saving..." : "Save Activity Note"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}

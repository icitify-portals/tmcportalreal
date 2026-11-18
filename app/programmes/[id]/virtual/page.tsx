"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { PublicNav } from "@/components/layout/public-nav"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Tv,
    ArrowLeft,
    Radio,
    Headphones,
    Video,
    UserCheck,
    MessageSquarePlus,
    FileDown,
    CheckCircle2,
    Send,
    ExternalLink,
    Megaphone,
    Calendar,
    RefreshCw,
    HelpCircle
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
    getVirtualHubData,
    submitVirtualCheckin,
    submitVirtualQuestion
} from "@/lib/actions/programme-camp-ops"

function getYouTubeEmbedUrl(url?: string | null): string | null {
    if (!url) return null
    try {
        const u = url.trim()
        // Already embed
        if (u.includes("youtube.com/embed/")) return u
        // youtube.com/watch?v=ID
        const watchMatch = u.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
        if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`
        // youtu.be/ID
        const shortMatch = u.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
        if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`
        // youtube.com/live/ID
        const liveMatch = u.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/)
        if (liveMatch) return `https://www.youtube.com/embed/${liveMatch[1]}`
        return null
    } catch {
        return null
    }
}

export default function VirtualParticipantsHubPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const id = params.id as string
    const regId = searchParams.get("reg") || ""

    const [programme, setProgramme] = useState<any>(null)
    const [config, setConfig] = useState<any>(null)
    const [checkins, setCheckins] = useState<any[]>([])
    const [questions, setQuestions] = useState<any[]>([])
    const [materials, setMaterials] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Check-in form state
    const [delegateName, setDelegateName] = useState("")
    const [emailOrPhone, setEmailOrPhone] = useState("")
    const [stateOrBranch, setStateOrBranch] = useState("")
    const [dayNumber, setDayNumber] = useState("1")
    const [checkedInSuccess, setCheckedInSuccess] = useState(false)
    const [isCheckingIn, setIsCheckingIn] = useState(false)

    // Question form state
    const [askerName, setAskerName] = useState("")
    const [askerLocation, setAskerLocation] = useState("")
    const [questionText, setQuestionText] = useState("")
    const [isSubmittingQ, setIsSubmittingQ] = useState(false)

    const loadData = async () => {
        setLoading(true)
        const res = await getVirtualHubData(id)
        if (res.success) {
            setProgramme(res.programme)
            setConfig(res.config)
            setCheckins(res.checkins || [])
            setQuestions(res.questions || [])
            setMaterials(res.materials || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        if (id) loadData()
    }, [id])

    const handleCheckin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!delegateName.trim()) {
            toast.error("Please enter your full name")
            return
        }

        setIsCheckingIn(true)
        const res = await submitVirtualCheckin({
            programmeId: id,
            registrationId: regId || undefined,
            delegateName,
            emailOrPhone,
            stateOrBranch,
            sessionTitle: config?.currentSessionTitle || programme?.title || "Main Virtual Session",
            dayNumber: parseInt(dayNumber || "1", 10),
        })

        if (res.success) {
            toast.success("Virtual session attendance recorded! Jazakumullahu Khayran.")
            setCheckedInSuccess(true)
            if (!askerName) {
                setAskerName(delegateName)
                setAskerLocation(stateOrBranch)
            }
            loadData()
        } else {
            toast.error(res.error || "Failed to record check-in")
        }
        setIsCheckingIn(false)
    }

    const handleQuestion = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!askerName.trim() || !questionText.trim()) {
            toast.error("Please enter your name and question")
            return
        }

        setIsSubmittingQ(true)
        const res = await submitVirtualQuestion({
            programmeId: id,
            sessionTitle: config?.currentSessionTitle || "Live Session",
            askerName,
            stateOrBranch: askerLocation,
            question: questionText,
        })

        if (res.success) {
            toast.success("Question forwarded to the stage moderator!")
            setQuestionText("")
            loadData()
        } else {
            toast.error(res.error || "Failed to submit question")
        }
        setIsSubmittingQ(false)
    }

    const embedUrl = getYouTubeEmbedUrl(config?.videoStreamUrl)
    const status = config?.streamStatus || "LIVE"

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <PublicNav />
            <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 space-y-6">
                {/* Top Navigation */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
                    <Link
                        href={`/programmes/${id}/schedule`}
                        className="inline-flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> Event Schedule
                    </Link>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
                            <Link href={`/programmes/${id}/announcements`}>
                                <Megaphone className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Notices
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
                            <Link href={`/programmes/${id}/as-i-see-it`}>
                                "As I See It"
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
                            <Link href={`/programmes/${id}/departments/assess`}>
                                Rate Depts
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" onClick={loadData} className="rounded-xl text-xs h-8">
                            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
                        </Button>
                    </div>
                </div>

                {/* Live Session Header */}
                <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2 max-w-2xl">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={`font-black text-xs px-2.5 py-0.5 border-none ${
                                    status === "LIVE" ? "bg-red-600 text-white animate-pulse" :
                                    status === "STARTING_SOON" ? "bg-amber-500 text-white" :
                                    status === "BREAK" ? "bg-blue-500 text-white" : "bg-gray-600 text-white"
                                }`}>
                                    <Radio className="w-3.5 h-3.5 mr-1 inline" /> {status.replace("_", " ")}
                                </Badge>
                                <Badge className="bg-white/15 text-blue-100 border-none text-xs">
                                    Virtual Participation Hub
                                </Badge>
                                <Badge className="bg-emerald-500/20 text-emerald-200 border-none text-xs">
                                    {checkins.length} Virtual Check-ins
                                </Badge>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                                {config?.currentSessionTitle || programme?.title || "Live Virtual Broadcast"}
                            </h1>
                            {config?.currentSpeaker && (
                                <p className="text-sm font-bold text-amber-300">
                                    Speaker / Moderator: {config.currentSpeaker}
                                </p>
                            )}
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                {config?.welcomeNote || "Join lectures live from anywhere, mark your session attendance, download lecture slides, and send questions straight to the stage moderator."}
                            </p>
                        </div>

                        {/* External Stream Buttons */}
                        <div className="flex flex-col gap-2 shrink-0">
                            {config?.zoomOrMeetUrl && (
                                <a href={config.zoomOrMeetUrl} target="_blank" rel="noreferrer">
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl gap-2">
                                        <Video className="w-4 h-4" /> Join Zoom / Google Meet Room <ExternalLink className="w-3.5 h-3.5" />
                                    </Button>
                                </a>
                            )}
                            {config?.audioStreamUrl && (
                                <a href={config.audioStreamUrl} target="_blank" rel="noreferrer">
                                    <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl gap-2">
                                        <Headphones className="w-4 h-4" /> Listen Live Audio (Mixlr) <ExternalLink className="w-3.5 h-3.5" />
                                    </Button>
                                </a>
                            )}
                            {config?.videoStreamUrl && !embedUrl && (
                                <a href={config.videoStreamUrl} target="_blank" rel="noreferrer">
                                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-2">
                                        <Tv className="w-4 h-4" /> Open Live Video Stream <ExternalLink className="w-3.5 h-3.5" />
                                    </Button>
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Stream Player & Q&A */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Video Stream Player Card */}
                        <Card className="rounded-3xl border border-gray-200 shadow-sm overflow-hidden bg-black">
                            {embedUrl ? (
                                <div className="aspect-video w-full">
                                    <iframe
                                        src={embedUrl}
                                        title={config?.currentSessionTitle || "Live Broadcast"}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            ) : (
                                <div className="aspect-video w-full flex flex-col items-center justify-center p-8 text-center text-white bg-gradient-to-br from-slate-900 to-slate-800 space-y-3">
                                    <Tv className="w-12 h-12 text-blue-400 opacity-80" />
                                    <h3 className="text-base font-bold">
                                        {config?.videoStreamUrl || config?.audioStreamUrl || config?.zoomOrMeetUrl
                                            ? "External Stream Configured Above"
                                            : "Broadcast Link Will Appear Here When Live"}
                                    </h3>
                                    <p className="text-xs text-slate-400 max-w-md">
                                        {config?.videoStreamUrl
                                            ? "Click the stream button above to open the broadcast in full screen."
                                            : "Media/IT Directorate will publish the YouTube, Mixlr audio, or Zoom link before the session starts."}
                                    </p>
                                    {config?.videoStreamUrl && (
                                        <a href={config.videoStreamUrl} target="_blank" rel="noreferrer">
                                            <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl gap-1.5 mt-2">
                                                <ExternalLink className="w-3.5 h-3.5" /> Watch Broadcast
                                            </Button>
                                        </a>
                                    )}
                                </div>
                            )}
                        </Card>

                        {/* Virtual Questions to Moderator */}
                        <Card className="rounded-3xl border border-gray-200 shadow-xs bg-white">
                            <CardHeader className="pb-3 border-b">
                                <CardTitle className="text-base font-black flex items-center gap-2">
                                    <HelpCircle className="w-5 h-5 text-blue-700" />
                                    Ask Question to the Stage / Speaker
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Remote delegates can ask questions directly without being physically present in the hall.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 space-y-5">
                                <form onSubmit={handleQuestion} className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        <Input
                                            required
                                            value={askerName}
                                            onChange={(e) => setAskerName(e.target.value)}
                                            placeholder="Your Name *"
                                            className="h-9 text-xs rounded-xl bg-white"
                                        />
                                        <Input
                                            value={askerLocation}
                                            onChange={(e) => setAskerLocation(e.target.value)}
                                            placeholder="Location / State (e.g. UK, Ogun, Benin)"
                                            className="h-9 text-xs rounded-xl bg-white"
                                        />
                                    </div>
                                    <Textarea
                                        required
                                        value={questionText}
                                        onChange={(e) => setQuestionText(e.target.value)}
                                        placeholder="Type your question for the lecturer or panel..."
                                        rows={2}
                                        className="text-xs rounded-xl bg-white"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={isSubmittingQ}
                                        className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl h-9 gap-1.5"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        {isSubmittingQ ? "Sending..." : "Submit Question to Stage"}
                                    </Button>
                                </form>

                                {/* Submitted Q&A Feed */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                                        Submitted Questions ({questions.filter(q => q.status !== "DISMISSED").length})
                                    </h4>

                                    {questions.filter(q => q.status !== "DISMISSED").length === 0 ? (
                                        <p className="text-xs text-gray-400 italic py-4 text-center">
                                            No virtual questions submitted for this session yet.
                                        </p>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {questions.filter(q => q.status !== "DISMISSED").map(q => (
                                                <div key={q.id} className="p-3.5 rounded-2xl border border-gray-200 bg-white space-y-1.5">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="text-xs font-bold text-gray-900">
                                                            {q.askerName} {q.stateOrBranch && <span className="text-gray-400 font-normal">({q.stateOrBranch})</span>}
                                                        </div>
                                                        <Badge className={`text-[10px] font-bold ${
                                                            q.status === "ANSWERED_LIVE" || q.status === "ANSWERED_TEXT"
                                                                ? "bg-emerald-100 text-emerald-800"
                                                                : "bg-amber-100 text-amber-800"
                                                        }`}>
                                                            {q.status.replace("_", " ")}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-gray-700">{q.question}</p>
                                                    {q.answerText && (
                                                        <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-900">
                                                            <strong className="block text-[10px] uppercase tracking-wider text-emerald-700">Moderator / Lecturer Response:</strong>
                                                            {q.answerText}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Attendance Register & Lecture Slides */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Virtual Check-In Register */}
                        <Card className="rounded-3xl border border-emerald-200 shadow-xs bg-white">
                            <CardHeader className="pb-3 border-b bg-emerald-50/50 rounded-t-3xl">
                                <CardTitle className="text-base font-black flex items-center gap-2 text-emerald-950">
                                    <UserCheck className="w-5 h-5 text-emerald-700" />
                                    Virtual Attendance Register
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Record your attendance for certificate verification and programme reporting.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-5">
                                {checkedInSuccess && (
                                    <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>You are checked in for <strong>Day {dayNumber}</strong>!</span>
                                    </div>
                                )}

                                <form onSubmit={handleCheckin} className="space-y-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-gray-700">Full Name *</Label>
                                        <Input
                                            required
                                            value={delegateName}
                                            onChange={(e) => setDelegateName(e.target.value)}
                                            placeholder="e.g. Sis. Zainab Balogun"
                                            className="h-9 text-xs rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-gray-700">Email or Phone Number</Label>
                                        <Input
                                            value={emailOrPhone}
                                            onChange={(e) => setEmailOrPhone(e.target.value)}
                                            placeholder="080... or email@..."
                                            className="h-9 text-xs rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-gray-700">State / Country / Branch</Label>
                                        <Input
                                            value={stateOrBranch}
                                            onChange={(e) => setStateOrBranch(e.target.value)}
                                            placeholder="e.g. Lagos / Porto-Novo / UK"
                                            className="h-9 text-xs rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-gray-700">Camp Day</Label>
                                        <select
                                            value={dayNumber}
                                            onChange={(e) => setDayNumber(e.target.value)}
                                            className="w-full h-9 rounded-xl border border-gray-300 bg-white px-3 text-xs font-bold"
                                        >
                                            {[1, 2, 3, 4, 5, 6].map(d => (
                                                <option key={d} value={d}>Day {d}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isCheckingIn}
                                        className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl h-10 gap-1.5"
                                    >
                                        <UserCheck className="w-4 h-4" />
                                        {isCheckingIn ? "Recording..." : "Mark Virtual Attendance"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Downloadable Lecture Slides / Handouts */}
                        <Card className="rounded-3xl border border-gray-200 shadow-xs bg-white">
                            <CardHeader className="pb-3 border-b">
                                <CardTitle className="text-sm font-black flex items-center gap-2">
                                    <FileDown className="w-4 h-4 text-purple-700" />
                                    Lecture Slides &amp; Handouts ({materials.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                {materials.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic text-center py-4">
                                        No slides or materials uploaded yet.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {materials.map((mat: any) => (
                                            <a
                                                key={mat.id}
                                                href={mat.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2.5 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/40 flex items-center justify-between gap-2 text-xs transition-all"
                                            >
                                                <span className="font-bold text-gray-800 truncate">{mat.title}</span>
                                                <ExternalLink className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}

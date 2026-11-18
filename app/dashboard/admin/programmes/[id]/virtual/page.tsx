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
    Tv,
    ArrowLeft,
    Save,
    ExternalLink,
    Copy,
    UserCheck,
    HelpCircle,
    CheckCircle2,
    XCircle,
    Search,
    Radio,
    Send
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
    getVirtualHubData,
    saveVirtualConfig,
    answerVirtualQuestion
} from "@/lib/actions/programme-camp-ops"

export default function AdminVirtualControlPage() {
    const params = useParams()
    const id = params.id as string

    const [activeTab, setActiveTab] = useState<"CONFIG" | "QA" | "ATTENDANCE">("CONFIG")
    const [loading, setLoading] = useState(true)
    const [programme, setProgramme] = useState<any>(null)
    const [checkins, setCheckins] = useState<any[]>([])
    const [questions, setQuestions] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState("")

    // Config state
    const [streamStatus, setStreamStatus] = useState("LIVE")
    const [videoStreamUrl, setVideoStreamUrl] = useState("")
    const [audioStreamUrl, setAudioStreamUrl] = useState("")
    const [zoomOrMeetUrl, setZoomOrMeetUrl] = useState("")
    const [currentSessionTitle, setCurrentSessionTitle] = useState("")
    const [currentSpeaker, setCurrentSpeaker] = useState("")
    const [welcomeNote, setWelcomeNote] = useState("")
    const [isSavingConfig, setIsSavingConfig] = useState(false)

    // Reply state for Q&A
    const [replyingId, setReplyingId] = useState<string | null>(null)
    const [answerText, setAnswerText] = useState("")

    const loadData = async () => {
        setLoading(true)
        const res = await getVirtualHubData(id)
        if (res.success) {
            setProgramme(res.programme)
            setCheckins(res.checkins || [])
            setQuestions(res.questions || [])
            if (res.config) {
                setStreamStatus(res.config.streamStatus || "LIVE")
                setVideoStreamUrl(res.config.videoStreamUrl || "")
                setAudioStreamUrl(res.config.audioStreamUrl || "")
                setZoomOrMeetUrl(res.config.zoomOrMeetUrl || "")
                setCurrentSessionTitle(res.config.currentSessionTitle || "")
                setCurrentSpeaker(res.config.currentSpeaker || "")
                setWelcomeNote(res.config.welcomeNote || "")
            }
        }
        setLoading(false)
    }

    useEffect(() => {
        if (id) loadData()
    }, [id])

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSavingConfig(true)
        const res = await saveVirtualConfig({
            programmeId: id,
            streamStatus,
            videoStreamUrl,
            audioStreamUrl,
            zoomOrMeetUrl,
            currentSessionTitle,
            currentSpeaker,
            welcomeNote,
        })

        if (res.success) {
            toast.success("Virtual broadcast settings updated!")
            loadData()
        } else {
            toast.error(res.error || "Failed to save configuration")
        }
        setIsSavingConfig(false)
    }

    const handleModerateQuestion = async (qId: string, status: string, reply?: string) => {
        const res = await answerVirtualQuestion(qId, status, reply)
        if (res.success) {
            toast.success("Question status updated")
            setReplyingId(null)
            setAnswerText("")
            loadData()
        } else {
            toast.error(res.error || "Failed to update question")
        }
    }

    const filteredCheckins = checkins.filter(c =>
        c.delegateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.stateOrBranch && c.stateOrBranch.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.sessionTitle && c.sessionTitle.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const pendingQuestionsCount = questions.filter(q => q.status === "PENDING").length

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-6xl mx-auto pb-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
                    <div className="flex items-center gap-3">
                        <Link href={`/dashboard/admin/programmes/${id}/registrations`}>
                            <Button variant="ghost" size="icon" className="rounded-xl">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Virtual Participants Control Room</h1>
                                <Badge className="bg-blue-700 text-white font-bold text-xs">Media &amp; Broadcast</Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Configure live stream links, moderate virtual delegate Q&amp;A, and monitor online session attendance.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
                            variant="outline"
                            className="rounded-xl text-xs font-semibold gap-1.5"
                            onClick={() => {
                                const url = `${window.location.origin}/programmes/${id}/virtual`
                                navigator.clipboard.writeText(url)
                                toast.success("Virtual Hub link copied!")
                            }}
                        >
                            <Copy className="w-3.5 h-3.5" /> Copy Virtual Hub Link
                        </Button>
                        <Link href={`/programmes/${id}/virtual`} target="_blank">
                            <Button className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold gap-1.5">
                                <ExternalLink className="w-3.5 h-3.5" /> Open Virtual Hub
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="rounded-2xl border border-gray-200 shadow-xs bg-white">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Stream Status</p>
                                <p className="text-xl font-black text-blue-700 mt-1">{streamStatus.replace("_", " ")}</p>
                            </div>
                            <Radio className="w-8 h-8 text-blue-600" />
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border border-gray-200 shadow-xs bg-white">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Virtual Check-Ins</p>
                                <p className="text-2xl font-black text-emerald-700 mt-1">{checkins.length}</p>
                            </div>
                            <UserCheck className="w-8 h-8 text-emerald-600" />
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border border-gray-200 shadow-xs bg-white">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Pending Questions</p>
                                <p className="text-2xl font-black text-amber-600 mt-1">{pendingQuestionsCount}</p>
                            </div>
                            <HelpCircle className="w-8 h-8 text-amber-600" />
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b">
                    <button
                        onClick={() => setActiveTab("CONFIG")}
                        className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                            activeTab === "CONFIG" ? "border-blue-600 text-blue-800" : "border-transparent text-gray-500"
                        }`}
                    >
                        Stream Settings
                    </button>
                    <button
                        onClick={() => setActiveTab("QA")}
                        className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                            activeTab === "QA" ? "border-blue-600 text-blue-800" : "border-transparent text-gray-500"
                        }`}
                    >
                        Stage Q&amp;A Queue ({questions.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("ATTENDANCE")}
                        className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                            activeTab === "ATTENDANCE" ? "border-blue-600 text-blue-800" : "border-transparent text-gray-500"
                        }`}
                    >
                        Attendance Log ({checkins.length})
                    </button>
                </div>

                {/* TAB 1: CONFIG */}
                {activeTab === "CONFIG" && (
                    <Card className="rounded-3xl border border-gray-200 shadow-xs bg-white">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-base font-black flex items-center gap-2">
                                <Tv className="w-5 h-5 text-blue-700" />
                                Broadcast Streams &amp; Current Session Info
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Paste YouTube Live links to embed video directly inside the portal, or add Mixlr/Zoom links.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSaveConfig} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-gray-700">Live Status</Label>
                                        <select
                                            value={streamStatus}
                                            onChange={(e) => setStreamStatus(e.target.value)}
                                            className="w-full h-9 rounded-xl border border-gray-300 bg-white px-3 text-xs font-bold"
                                        >
                                            <option value="LIVE">LIVE NOW (On Air)</option>
                                            <option value="STARTING_SOON">STARTING SOON</option>
                                            <option value="BREAK">INTERMISSION / SALAH BREAK</option>
                                            <option value="OFFLINE">OFFLINE / ENDED</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-gray-700">Current Session Title</Label>
                                        <Input
                                            value={currentSessionTitle}
                                            onChange={(e) => setCurrentSessionTitle(e.target.value)}
                                            placeholder="e.g. Opening Lecture: Upholding Spiritual Integrity"
                                            className="h-9 text-xs rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-gray-700">Current Speaker / Moderator</Label>
                                        <Input
                                            value={currentSpeaker}
                                            onChange={(e) => setCurrentSpeaker(e.target.value)}
                                            placeholder="e.g. Amir AbdulWasi'i Bangbala"
                                            className="h-9 text-xs rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-gray-700">Video Stream URL (YouTube Live / Facebook)</Label>
                                        <Input
                                            value={videoStreamUrl}
                                            onChange={(e) => setVideoStreamUrl(e.target.value)}
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            className="h-9 text-xs rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-gray-700">Audio Radio URL (Mixlr / ZenoRadio)</Label>
                                        <Input
                                            value={audioStreamUrl}
                                            onChange={(e) => setAudioStreamUrl(e.target.value)}
                                            placeholder="https://mixlr.com/..."
                                            className="h-9 text-xs rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-gray-700">Zoom / Google Meet Link (Interactive Workshops)</Label>
                                        <Input
                                            value={zoomOrMeetUrl}
                                            onChange={(e) => setZoomOrMeetUrl(e.target.value)}
                                            placeholder="https://zoom.us/j/..."
                                            className="h-9 text-xs rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-1 sm:col-span-2">
                                        <Label className="text-xs font-bold text-gray-700">Welcome Note for Remote Participants</Label>
                                        <Textarea
                                            value={welcomeNote}
                                            onChange={(e) => setWelcomeNote(e.target.value)}
                                            placeholder="Instructions on attendance marking, Q&A etiquette, or audio fallback..."
                                            rows={3}
                                            className="text-xs rounded-xl"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button
                                        type="submit"
                                        disabled={isSavingConfig}
                                        className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl h-10 px-6 gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        {isSavingConfig ? "Saving..." : "Save & Update Virtual Hub"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* TAB 2: Q&A MODERATION */}
                {activeTab === "QA" && (
                    <div className="space-y-3">
                        {questions.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-dashed p-12 text-center text-xs text-gray-400">
                                No questions submitted by virtual delegates yet.
                            </div>
                        ) : (
                            questions.map(q => (
                                <Card key={q.id} className="rounded-2xl border border-gray-200 shadow-xs bg-white">
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <span className="font-black text-sm text-gray-900">{q.askerName}</span>
                                                {q.stateOrBranch && <span className="text-xs text-gray-500 ml-1.5">({q.stateOrBranch})</span>}
                                                <div className="text-[11px] text-gray-400">
                                                    Session: {q.sessionTitle} • {new Date(q.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                            <Badge className={`text-[10px] font-bold ${
                                                q.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                                                q.status === "DISMISSED" ? "bg-gray-100 text-gray-600" : "bg-emerald-100 text-emerald-800"
                                            }`}>
                                                {q.status.replace("_", " ")}
                                            </Badge>
                                        </div>

                                        <p className="text-sm text-gray-800 font-medium bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            "{q.question}"
                                        </p>

                                        {q.answerText && (
                                            <p className="text-xs text-emerald-900 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                                                <strong>Written Answer:</strong> {q.answerText}
                                            </p>
                                        )}

                                        {replyingId === q.id ? (
                                            <div className="space-y-2 pt-1">
                                                <Textarea
                                                    value={answerText}
                                                    onChange={(e) => setAnswerText(e.target.value)}
                                                    placeholder="Type written answer for the delegate..."
                                                    rows={2}
                                                    className="text-xs rounded-xl"
                                                />
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleModerateQuestion(q.id, "ANSWERED_TEXT", answerText)}
                                                        className="bg-emerald-700 text-white text-xs rounded-xl h-8 gap-1"
                                                    >
                                                        <Send className="w-3 h-3" /> Send Answer
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setReplyingId(null)}
                                                        className="text-xs rounded-xl h-8"
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleModerateQuestion(q.id, "ANSWERED_LIVE")}
                                                    className="h-8 text-xs rounded-xl text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Answered On Stage
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setReplyingId(q.id)
                                                        setAnswerText(q.answerText || "")
                                                    }}
                                                    className="h-8 text-xs rounded-xl text-blue-700 border-blue-200 hover:bg-blue-50"
                                                >
                                                    Write Reply
                                                </Button>
                                                {q.status !== "DISMISSED" && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleModerateQuestion(q.id, "DISMISSED")}
                                                        className="h-8 text-xs rounded-xl text-gray-500 hover:text-red-600 gap-1"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" /> Dismiss
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {/* TAB 3: VIRTUAL ATTENDANCE */}
                {activeTab === "ATTENDANCE" && (
                    <div className="space-y-4">
                        <div className="relative w-full sm:w-80">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search delegate name, branch, session..."
                                className="pl-9 h-9 text-xs rounded-xl bg-white"
                            />
                        </div>

                        {filteredCheckins.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-dashed p-12 text-center text-xs text-gray-400">
                                No virtual attendance check-ins recorded yet.
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 border-b text-[11px] font-bold text-gray-500 uppercase">
                                                <th className="py-3 px-4">Delegate Name</th>
                                                <th className="py-3 px-4">State / Branch</th>
                                                <th className="py-3 px-4">Contact</th>
                                                <th className="py-3 px-4">Session / Day</th>
                                                <th className="py-3 px-4">Check-in Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-xs">
                                            {filteredCheckins.map(c => (
                                                <tr key={c.id} className="hover:bg-gray-50/50">
                                                    <td className="py-3 px-4 font-bold text-gray-900">{c.delegateName}</td>
                                                    <td className="py-3 px-4 text-gray-600">{c.stateOrBranch || "—"}</td>
                                                    <td className="py-3 px-4 text-gray-600">{c.emailOrPhone || "—"}</td>
                                                    <td className="py-3 px-4">
                                                        <Badge variant="outline" className="text-[10px] mr-1.5">Day {c.dayNumber}</Badge>
                                                        <span className="font-medium text-gray-700">{c.sessionTitle}</span>
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-500">
                                                        {new Date(c.checkedInAt).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}

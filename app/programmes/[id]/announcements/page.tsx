"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { PublicNav } from "@/components/layout/public-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Megaphone,
    ArrowLeft,
    Pin,
    Clock,
    Search,
    Paperclip,
    Radio,
    AlertTriangle,
    Users,
    Calendar,
    Utensils,
    Eye,
    Store,
    Award,
    Tv,
    RefreshCw
} from "lucide-react"
import Link from "next/link"
import { getProgrammeAnnouncements, getProgrammeCampDetails } from "@/lib/actions/programme-camp-ops"

const CATEGORIES = [
    { value: "ALL", label: "All Bulletins" },
    { value: "URGENT_DIRECTIVE", label: "Urgent Directives" },
    { value: "PRAYER_SPIRITUAL", label: "Prayer & Spiritual" },
    { value: "LOGISTICS_WELFARE", label: "Logistics & Welfare" },
    { value: "LOST_AND_FOUND", label: "Lost & Found" },
    { value: "HEALTH_SAFETY", label: "Health & Safety" },
    { value: "GENERAL", label: "General Info" },
]

export default function DelegateAnnouncementsPage() {
    const params = useParams()
    const id = params.id as string

    const [programme, setProgramme] = useState<any>(null)
    const [announcements, setAnnouncements] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState("ALL")
    const [searchQuery, setSearchQuery] = useState("")

    const loadData = async () => {
        setLoading(true)
        const [prog, annRes] = await Promise.all([
            getProgrammeCampDetails(id),
            getProgrammeAnnouncements(id),
        ])
        setProgramme(prog)
        if (annRes.success) {
            setAnnouncements(annRes.data)
        }
        setLoading(false)
    }

    useEffect(() => {
        if (id) loadData()
    }, [id])

    const filtered = announcements.filter(a => {
        const matchesCat = selectedCategory === "ALL" || a.category === selectedCategory
        const matchesQuery = !searchQuery.trim() ||
            a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.content.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCat && matchesQuery
    })

    const getPriorityBadge = (priority: string) => {
        if (priority === "CRITICAL") return "bg-red-100 text-red-800 border-red-200"
        if (priority === "HIGH") return "bg-amber-100 text-amber-800 border-amber-200"
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <PublicNav />
            <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 space-y-6">
                {/* Top Nav Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
                    <Link
                        href={`/programmes/${id}/schedule`}
                        className="inline-flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> Event Schedule
                    </Link>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
                            <Link href={`/programmes/${id}/meals`}>
                                <Utensils className="w-3.5 h-3.5 mr-1 text-amber-600" /> Meals
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
                            <Link href={`/programmes/${id}/virtual`}>
                                <Tv className="w-3.5 h-3.5 mr-1 text-blue-600" /> Virtual Hub
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
                            <Link href={`/programmes/${id}/as-i-see-it`}>
                                <Eye className="w-3.5 h-3.5 mr-1 text-emerald-600" /> As I See It
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" onClick={loadData} className="rounded-xl text-xs h-8">
                            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
                        </Button>
                    </div>
                </div>

                {/* Live Ticker Banner if active */}
                {programme?.nextActionTicker && (
                    <div className="bg-gradient-to-r from-emerald-700 via-green-600 to-teal-800 text-white p-4 rounded-2xl shadow-md flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl shrink-0">
                            <Radio className="w-5 h-5 text-amber-300 animate-pulse" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100">
                                Live Action Ticker
                            </p>
                            <p className="text-sm font-bold text-white">{programme.nextActionTicker}</p>
                        </div>
                    </div>
                )}

                {/* Banner */}
                <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg">
                    <div className="space-y-2">
                        <Badge className="bg-white/20 text-white border-none font-bold text-xs uppercase tracking-wider">
                            Official Camp Broadcast Window
                        </Badge>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
                            <Megaphone className="w-7 h-7 text-amber-300" />
                            Camp Bulletins & Notices
                        </h1>
                        <p className="text-emerald-100 text-xs sm:text-sm max-w-2xl">
                            Official directives, prayer reminders, lost &amp; found alerts, and general updates for all registered participants of {programme?.title || "the programme"}.
                        </p>
                    </div>
                </div>

                {/* Search & Categories */}
                <div className="space-y-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search announcements, lost items, directives..."
                            className="pl-10 h-10 text-xs rounded-2xl bg-white border-gray-200"
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {CATEGORIES.map(c => (
                            <Button
                                key={c.value}
                                size="sm"
                                variant={selectedCategory === c.value ? "default" : "outline"}
                                onClick={() => setSelectedCategory(c.value)}
                                className={`rounded-xl text-xs font-bold h-8 shrink-0 ${
                                    selectedCategory === c.value ? "bg-emerald-700 hover:bg-emerald-800 text-white" : "bg-white"
                                }`}
                            >
                                {c.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Announcements List */}
                {loading ? (
                    <div className="bg-white rounded-3xl p-12 text-center text-xs text-gray-400 border">
                        Loading official camp notices...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-12 text-center space-y-2">
                        <Megaphone className="w-10 h-10 text-gray-300 mx-auto" />
                        <p className="text-sm font-bold text-gray-700">No announcements published in this category yet</p>
                        <p className="text-xs text-gray-400">Check back periodically for real-time camp directives and updates.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map(item => (
                            <Card
                                key={item.id}
                                className={`rounded-2xl shadow-xs overflow-hidden transition-all ${
                                    item.isPinned
                                        ? "border-2 border-amber-300 bg-amber-50/30"
                                        : "border border-gray-200 bg-white"
                                }`}
                            >
                                <CardContent className="p-5 space-y-3">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {item.isPinned && (
                                                <Badge className="bg-amber-500 text-white text-[10px] font-black gap-1">
                                                    <Pin className="w-3 h-3" /> PINNED
                                                </Badge>
                                            )}
                                            <Badge className={`text-[10px] font-bold border ${getPriorityBadge(item.priority)}`}>
                                                {item.priority === "CRITICAL" && <AlertTriangle className="w-3 h-3 mr-1 inline" />}
                                                {item.priority}
                                            </Badge>
                                            <Badge variant="secondary" className="text-[10px] font-bold">
                                                {item.category?.replace(/_/g, " ")}
                                            </Badge>
                                            {item.targetAudience && (
                                                <Badge variant="outline" className="text-[10px] font-semibold text-gray-600 gap-1">
                                                    <Users className="w-3 h-3" /> {item.targetAudience.replace(/_/g, " ")}
                                                </Badge>
                                            )}
                                        </div>

                                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(item.createdAt).toLocaleString()}
                                        </span>
                                    </div>

                                    <div>
                                        <h2 className="text-base sm:text-lg font-black text-gray-900">{item.title}</h2>
                                        <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mt-1.5">
                                            {item.content}
                                        </p>
                                    </div>

                                    <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
                                        <span>Issued by: <strong className="text-gray-800">{item.authorName || "Camp Secretariat"}</strong></span>
                                        {item.attachmentUrl && (
                                            <a
                                                href={item.attachmentUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline"
                                            >
                                                <Paperclip className="w-3.5 h-3.5" /> View Attached Circular / Document
                                            </a>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}

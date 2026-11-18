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
    Megaphone,
    ArrowLeft,
    Pin,
    Trash2,
    Send,
    ExternalLink,
    MessageCircle,
    Copy,
    Radio,
    Paperclip,
    Clock,
    AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
    getProgrammeAnnouncements,
    createProgrammeAnnouncement,
    togglePinAnnouncement,
    deleteProgrammeAnnouncement,
    getProgrammeCampDetails
} from "@/lib/actions/programme-camp-ops"

export default function AdminProgrammeAnnouncementsPage() {
    const params = useParams()
    const id = params.id as string

    const [programme, setProgramme] = useState<any>(null)
    const [announcements, setAnnouncements] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Form state
    const [title, setTitle] = useState("")
    const [category, setCategory] = useState("GENERAL")
    const [priority, setPriority] = useState("NORMAL")
    const [targetAudience, setTargetAudience] = useState("ALL_DELEGATES")
    const [content, setContent] = useState("")
    const [attachmentUrl, setAttachmentUrl] = useState("")
    const [isPinned, setIsPinned] = useState(false)
    const [alsoUpdateTicker, setAlsoUpdateTicker] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const loadData = async () => {
        setLoading(true)
        const [prog, res] = await Promise.all([
            getProgrammeCampDetails(id),
            getProgrammeAnnouncements(id),
        ])
        setProgramme(prog)
        if (res.success) setAnnouncements(res.data)
        setLoading(false)
    }

    useEffect(() => {
        if (id) loadData()
    }, [id])

    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !content.trim()) {
            toast.error("Please enter both headline and message content")
            return
        }

        setIsSubmitting(true)
        const res = await createProgrammeAnnouncement({
            programmeId: id,
            title,
            content,
            category,
            priority,
            targetAudience,
            attachmentUrl,
            isPinned,
            alsoUpdateTicker,
        })

        if (res.success) {
            toast.success("Announcement published to all delegates!")
            setTitle("")
            setContent("")
            setAttachmentUrl("")
            setIsPinned(false)
            loadData()
        } else {
            toast.error(res.error || "Failed to publish announcement")
        }
        setIsSubmitting(false)
    }

    const handleTogglePin = async (annId: string, currentPinned: boolean) => {
        const res = await togglePinAnnouncement(annId, !currentPinned)
        if (res.success) {
            toast.success(!currentPinned ? "Pinned to top of noticeboard" : "Unpinned")
            loadData()
        } else {
            toast.error(res.error || "Failed to update pin")
        }
    }

    const handleDelete = async (annId: string) => {
        if (!confirm("Delete this announcement permanently?")) return
        const res = await deleteProgrammeAnnouncement(annId)
        if (res.success) {
            toast.success("Announcement deleted")
            loadData()
        } else {
            toast.error(res.error || "Failed to delete")
        }
    }

    const shareToWhatsApp = (item: any) => {
        const origin = typeof window !== "undefined" ? window.location.origin : ""
        const text = `📢 *OFFICIAL CAMP NOTICE — ${programme?.title || "TMC"}*\n\n*${item.title}*\n\n${item.content}\n\n🔗 Read all live notices:\n${origin}/programmes/${id}/announcements`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
    }

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
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Information Dissemination Center</h1>
                                <Badge className="bg-emerald-700 text-white font-bold text-xs">Broadcast Hub</Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Publish directives, prayer timings, lost &amp; found alerts, and official notices to all registered delegates.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
                            variant="outline"
                            className="rounded-xl text-xs font-semibold gap-1.5"
                            onClick={() => {
                                const url = `${window.location.origin}/programmes/${id}/announcements`
                                navigator.clipboard.writeText(url)
                                toast.success("Noticeboard link copied!")
                            }}
                        >
                            <Copy className="w-3.5 h-3.5" /> Copy Delegate Link
                        </Button>
                        <Link href={`/programmes/${id}/announcements`} target="_blank">
                            <Button className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold gap-1.5">
                                <ExternalLink className="w-3.5 h-3.5" /> View Public Noticeboard
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Publish Form */}
                    <div className="lg:col-span-5">
                        <Card className="rounded-2xl border border-gray-200 shadow-xs bg-white sticky top-4">
                            <CardHeader className="pb-3 border-b">
                                <CardTitle className="text-base font-black flex items-center gap-2">
                                    <Megaphone className="w-5 h-5 text-emerald-700" />
                                    Broadcast New Bulletin
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Messages appear immediately on the delegate Noticeboard and Access Slips.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-5">
                                <form onSubmit={handlePublish} className="space-y-3.5">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-gray-700">Announcement Headline *</Label>
                                        <Input
                                            required
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g. Maghrib Congregation & Dinner Schedule Update"
                                            className="h-9 text-xs rounded-xl"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2.5">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold text-gray-700">Category</Label>
                                            <select
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                className="w-full h-9 rounded-xl border border-gray-300 bg-white px-2.5 text-xs font-medium"
                                            >
                                                <option value="GENERAL">General Info</option>
                                                <option value="URGENT_DIRECTIVE">Urgent Directive</option>
                                                <option value="PRAYER_SPIRITUAL">Prayer &amp; Spiritual</option>
                                                <option value="LOGISTICS_WELFARE">Logistics &amp; Welfare</option>
                                                <option value="LOST_AND_FOUND">Lost &amp; Found</option>
                                                <option value="HEALTH_SAFETY">Health &amp; Safety</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold text-gray-700">Priority Level</Label>
                                            <select
                                                value={priority}
                                                onChange={(e) => setPriority(e.target.value)}
                                                className="w-full h-9 rounded-xl border border-gray-300 bg-white px-2.5 text-xs font-bold"
                                            >
                                                <option value="NORMAL">Normal</option>
                                                <option value="HIGH">High Priority</option>
                                                <option value="CRITICAL">CRITICAL ALERT</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-gray-700">Target Audience</Label>
                                        <select
                                            value={targetAudience}
                                            onChange={(e) => setTargetAudience(e.target.value)}
                                            className="w-full h-9 rounded-xl border border-gray-300 bg-white px-2.5 text-xs font-medium"
                                        >
                                            <option value="ALL_DELEGATES">All Registered Participants</option>
                                            <option value="BROTHERS">Brothers Hostels / Wings</option>
                                            <option value="SISTERS">Sisters Hostels / Wings</option>
                                            <option value="OFFICERS_OFFICIALS">Camp Officers &amp; Directorate</option>
                                            <option value="VIRTUAL_PARTICIPANTS">Virtual Participants</option>
                                            <option value="STATE_COORDINATORS">State / Zonal Coordinators</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-gray-700">Full Announcement Details *</Label>
                                        <Textarea
                                            required
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            placeholder="Write clear instructions, venue, time, and contact desk if applicable..."
                                            rows={4}
                                            className="text-xs rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-gray-700">Attachment / Circular URL (Optional)</Label>
                                        <Input
                                            value={attachmentUrl}
                                            onChange={(e) => setAttachmentUrl(e.target.value)}
                                            placeholder="https://..."
                                            className="h-9 text-xs rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-2 pt-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={isPinned}
                                                onChange={(e) => setIsPinned(e.target.checked)}
                                                className="rounded text-emerald-700 w-4 h-4"
                                            />
                                            <Pin className="w-3.5 h-3.5 text-amber-600" /> Pin to top of Noticeboard
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={alsoUpdateTicker}
                                                onChange={(e) => setAlsoUpdateTicker(e.target.checked)}
                                                className="rounded text-emerald-700 w-4 h-4"
                                            />
                                            <Radio className="w-3.5 h-3.5 text-emerald-600" /> Also update Live Action Ticker on Slips
                                        </label>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl h-10 text-xs gap-2"
                                    >
                                        <Send className="w-4 h-4" />
                                        {isSubmitting ? "Publishing..." : "Publish Announcement"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Published Bulletins */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-black uppercase tracking-wider text-gray-600">
                                Published Bulletins ({announcements.length})
                            </h2>
                        </div>

                        {loading ? (
                            <div className="bg-white rounded-2xl p-12 text-center text-xs text-gray-400 border">
                                Loading bulletins...
                            </div>
                        ) : announcements.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center space-y-2">
                                <Megaphone className="w-10 h-10 text-gray-300 mx-auto" />
                                <p className="text-sm font-bold text-gray-700">No announcements published yet</p>
                                <p className="text-xs text-gray-400">Use the panel on the left to broadcast your first notice.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {announcements.map(item => (
                                    <Card
                                        key={item.id}
                                        className={`rounded-2xl shadow-xs bg-white ${
                                            item.isPinned ? "border-2 border-amber-300" : "border border-gray-200"
                                        }`}
                                    >
                                        <CardContent className="p-4 space-y-2.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {item.isPinned && (
                                                        <Badge className="bg-amber-500 text-white text-[10px] font-bold">
                                                            <Pin className="w-3 h-3 mr-1" /> Pinned
                                                        </Badge>
                                                    )}
                                                    <Badge variant="secondary" className="text-[10px] font-bold">
                                                        {item.category?.replace(/_/g, " ")}
                                                    </Badge>
                                                    <Badge className={`text-[10px] font-bold ${
                                                        item.priority === "CRITICAL" ? "bg-red-100 text-red-800" :
                                                        item.priority === "HIGH" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700"
                                                    }`}>
                                                        {item.priority}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {item.targetAudience?.replace(/_/g, " ")}
                                                    </Badge>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleTogglePin(item.id, item.isPinned)}
                                                        className={`h-7 px-2 text-xs rounded-lg ${item.isPinned ? "text-amber-600" : "text-gray-400"}`}
                                                        title={item.isPinned ? "Unpin" : "Pin to top"}
                                                    >
                                                        <Pin className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => shareToWhatsApp(item)}
                                                        className="h-7 px-2 text-xs rounded-lg text-green-700 hover:bg-green-50"
                                                        title="Forward to WhatsApp"
                                                    >
                                                        <MessageCircle className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDelete(item.id)}
                                                        className="h-7 px-2 text-xs rounded-lg text-red-500 hover:bg-red-50"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <h3 className="text-sm font-black text-gray-900">{item.title}</h3>
                                            <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{item.content}</p>

                                            <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1.5 border-t border-gray-100">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {new Date(item.createdAt).toLocaleString()}
                                                </span>
                                                {item.attachmentUrl && (
                                                    <a href={item.attachmentUrl} target="_blank" rel="noreferrer" className="text-emerald-700 font-bold flex items-center gap-1 hover:underline">
                                                        <Paperclip className="w-3 h-3" /> Attachment
                                                    </a>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

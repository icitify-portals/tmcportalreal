"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
    Calendar, 
    Utensils, 
    Eye, 
    Store, 
    Award, 
    Users, 
    DoorOpen, 
    FileText, 
    Copy, 
    Check, 
    ExternalLink, 
    Share2, 
    MessageCircle, 
    QrCode, 
    Radio,
    ShieldCheck,
    Printer,
    Download,
    Megaphone,
    Hash,
    Tv
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface ProgrammeCampOperationsTabProps {
    programmeId: string
    programmeTitle: string
}

export function ProgrammeCampOperationsTab({ programmeId, programmeTitle }: ProgrammeCampOperationsTabProps) {
    const [origin, setOrigin] = useState("")
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
    const [qrModalItem, setQrModalItem] = useState<{ title: string; url: string } | null>(null)

    useEffect(() => {
        if (typeof window !== "undefined") {
            setOrigin(window.location.origin)
        }
    }, [])

    const copyToClipboard = async (url: string, label: string) => {
        try {
            await navigator.clipboard.writeText(url)
            setCopiedUrl(url)
            toast.success(`${label} link copied to clipboard!`)
            setTimeout(() => setCopiedUrl(null), 2500)
        } catch {
            toast.error("Failed to copy link")
        }
    }

    const shareToWhatsApp = (title: string, url: string, description: string) => {
        const text = `Assalamu alaykum.

📌 *${programmeTitle}*
${title}
${description}

🔗 *Direct Link:*
${url}

Kindly share with all registered delegates.`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
    }

    const operationsModules = [
        {
            id: "schedule",
            title: "Live Event Schedule & Ticker",
            category: "Programme Flow",
            desc: "Daily session agenda, speaker timeline, 'Now Happening' tracker, and live broadcast announcement ticker.",
            adminPath: `/dashboard/admin/programmes/${programmeId}/schedule`,
            publicPath: `/programmes/${programmeId}/schedule`,
            icon: Calendar,
            color: "emerald",
            shareable: true,
            whatsappDesc: "Track daily lectures, speakers, venues, and live announcements on the go.",
        },
        {
            id: "meals",
            title: "Food Timetable & Meal Ratings",
            category: "Camp Welfare",
            desc: "Daily food timetable (Breakfast, Lunch, Dinner) and interactive 5-star delegate meal quality rating drawer.",
            adminPath: `/dashboard/admin/programmes/${programmeId}/meals`,
            publicPath: `/programmes/${programmeId}/meals`,
            icon: Utensils,
            color: "amber",
            shareable: true,
            whatsappDesc: "Check the daily food timetable and submit your meal rating/feedback.",
        },
        {
            id: "as-i-see-it",
            title: "\"As I See It\" Observation Box",
            category: "Delegate Feedback",
            desc: "Real-time suggestion and observation box with anonymous toggle, urgency flags, and leadership plenary review.",
            adminPath: `/dashboard/admin/programmes/${programmeId}/as-i-see-it`,
            publicPath: `/programmes/${programmeId}/as-i-see-it`,
            icon: Eye,
            color: "blue",
            shareable: true,
            whatsappDesc: "Submit your observations, logistics suggestions, and complaints directly to the leadership.",
        },
        {
            id: "bazaar",
            title: "Camp Bazaar & Vendor Directory",
            category: "Commercial Market",
            desc: "Camp market stalls directory: Islamic books, attire, perfumes, herbal products, and direct WhatsApp contact.",
            adminPath: `/dashboard/admin/programmes/${programmeId}/vendors`,
            publicPath: `/programmes/${programmeId}/vendors`,
            icon: Store,
            color: "purple",
            shareable: true,
            whatsappDesc: "Explore the camp market, bookshops, attires, and stall locations.",
        },
        {
            id: "kpi",
            title: "Departmental KPI Assessment",
            category: "Quality Assurance",
            desc: "Delegate rating of 10 camp directorates across 4 KPI dimensions, plus supervisory committee final scoring.",
            adminPath: `/dashboard/admin/programmes/${programmeId}/departments`,
            publicPath: `/programmes/${programmeId}/departments/assess`,
            icon: Award,
            color: "indigo",
            shareable: true,
            whatsappDesc: "Evaluate the performance of camp departments and directorates.",
        },
        {
            id: "visitors",
            title: "Visitor Management Desk",
            category: "Camp Security",
            desc: "Log and vet day visitors, dignitaries, and family members. Automatic tag generation and 1-click check-out.",
            adminPath: `/dashboard/admin/programmes/${programmeId}/visitors`,
            publicPath: null,
            icon: Users,
            color: "blue",
            shareable: false,
        },
        {
            id: "gate-pass",
            title: "Gate Pass & Movement Tracker",
            category: "Camp Security",
            desc: "Issue authorized gate passes for temporary camp exit, track expected return, and trigger overdue alerts.",
            adminPath: `/dashboard/admin/programmes/${programmeId}/gate-pass`,
            publicPath: null,
            icon: DoorOpen,
            color: "amber",
            shareable: false,
        },
        {
            id: "notes",
            title: "Departmental Documentation & Logs",
            category: "Camp Reporting",
            desc: "Daily debrief minutes, shift handovers, breakdown incident reports, and official documentation.",
            adminPath: `/dashboard/admin/programmes/${programmeId}/departments`,
            publicPath: null,
            icon: FileText,
            color: "emerald",
            shareable: false,
        },
        {
            id: "announcements",
            title: "Broadcast Notices & Info Window",
            category: "Information Desk",
            desc: "Publish official circulars, prayer updates, lost & found alerts, and push directly to delegates' noticeboard.",
            adminPath: `/dashboard/admin/programmes/${programmeId}/announcements`,
            publicPath: `/programmes/${programmeId}/announcements`,
            icon: Megaphone,
            color: "emerald",
            shareable: true,
            whatsappDesc: "Read official camp circulars, urgent notices, lost & found alerts, and directives.",
        },
        {
            id: "channels",
            title: "Officer & Zonal Channels",
            category: "Team Coordination",
            desc: "In-portal departmental & zonal coordination rooms replacing fragmented WhatsApp groups.",
            adminPath: `/dashboard/admin/programmes/${programmeId}/channels`,
            publicPath: `/programmes/${programmeId}/channels`,
            icon: Hash,
            color: "blue",
            shareable: true,
            whatsappDesc: "Join your Departmental or Zonal Officer Coordination Room inside the portal.",
        },
        {
            id: "virtual",
            title: "Virtual Participants Hub",
            category: "Live Broadcast",
            desc: "Live video/audio stream player, virtual session attendance marking, lecture slides, and online Q&A.",
            adminPath: `/dashboard/admin/programmes/${programmeId}/virtual`,
            publicPath: `/programmes/${programmeId}/virtual`,
            icon: Tv,
            color: "indigo",
            shareable: true,
            whatsappDesc: "Join the live stream, mark virtual attendance, and send questions to the stage.",
        },
    ]

    return (
        <div className="space-y-6">
            {/* Top Banner */}
            <div className="rounded-2xl border border-emerald-800/50 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 p-6 text-white shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-semibold px-2.5 py-0.5">
                                Camp Operations Command
                            </Badge>
                            <Badge variant="outline" className="border-teal-500 text-teal-200 text-xs">
                                11 Active Operational Modules
                            </Badge>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                            Camp Logistics, Quality & Security Desk
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300">
                            Manage schedules, kitchen welfare, security gates, attendee feedback, and share live direct links with camp delegates.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
                            variant="outline"
                            asChild
                            className="bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 text-xs font-bold rounded-xl"
                        >
                            <a href="/TMC_Camp_Operations_Testing_Guide.pdf" download="TMC_Camp_Operations_Testing_Guide.pdf">
                                <Download className="w-3.5 h-3.5 mr-1.5" /> Download Testing Guide (PDF)
                            </a>
                        </Button>
                        <Button 
                            variant="outline" 
                            className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold rounded-xl"
                            onClick={() => {
                                const fullUrl = `${origin}/programmes/${programmeId}/schedule`
                                copyToClipboard(fullUrl, "Full Camp Portal")
                            }}
                        >
                            <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Schedule Link
                        </Button>
                    </div>
                </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {operationsModules.map(mod => {
                    const fullPublicUrl = mod.publicPath ? `${origin}${mod.publicPath}` : ""
                    const isCopied = copiedUrl === fullPublicUrl

                    return (
                        <Card key={mod.id} className="rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden bg-white">
                            <CardContent className="p-5 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`p-2 rounded-xl bg-${mod.color}-50 text-${mod.color}-700 border border-${mod.color}-100 shrink-0`}>
                                            <mod.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider mb-0.5">
                                                {mod.category}
                                            </Badge>
                                            <h3 className="text-base font-black text-gray-900 leading-tight">
                                                {mod.title}
                                            </h3>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-600 leading-relaxed">
                                    {mod.desc}
                                </p>

                                {/* Public Link Preview if Shareable */}
                                {mod.shareable && fullPublicUrl && (
                                    <div className="pt-2 border-t space-y-1.5">
                                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-500">
                                            <span>Delegate Shareable Link:</span>
                                            <span className="text-emerald-700">Public Access</span>
                                        </div>
                                        <div className="p-1.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-1 text-[11px] font-mono text-gray-600 truncate">
                                            <span className="truncate">{fullPublicUrl}</span>
                                            <button 
                                                onClick={() => copyToClipboard(fullPublicUrl, mod.title)}
                                                className="p-1 hover:bg-gray-200 rounded-md text-gray-600 shrink-0"
                                                title="Copy link"
                                            >
                                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>

                            {/* Actions Footer */}
                            <div className="p-3 bg-gray-50/80 border-t flex items-center justify-between gap-2">
                                <Link href={mod.adminPath}>
                                    <Button size="sm" className="h-8 px-3 text-xs font-bold rounded-xl bg-gray-900 hover:bg-gray-800 text-white">
                                        Open Desk →
                                    </Button>
                                </Link>

                                {mod.shareable && fullPublicUrl && (
                                    <div className="flex items-center gap-1.5">
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => copyToClipboard(fullPublicUrl, mod.title)}
                                            className="h-8 px-2 text-xs rounded-xl"
                                            title="Copy link"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </Button>

                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => shareToWhatsApp(mod.title, fullPublicUrl, mod.whatsappDesc || "")}
                                            className="h-8 px-2 text-xs rounded-xl text-green-700 hover:bg-green-50 border-green-200"
                                            title="Share to WhatsApp"
                                        >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                        </Button>

                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => setQrModalItem({ title: mod.title, url: fullPublicUrl })}
                                            className="h-8 px-2 text-xs rounded-xl"
                                            title="QR Code"
                                        >
                                            <QrCode className="w-3.5 h-3.5" />
                                        </Button>

                                        <Link href={mod.publicPath!} target="_blank">
                                            <Button size="sm" variant="ghost" className="h-8 px-2 text-xs rounded-xl text-gray-500" title="Preview public view">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )
                })}
            </div>

            {/* QR Code Modal */}
            {qrModalItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-gray-200 text-center">
                        <div className="border-b pb-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Delegate Direct Access QR</p>
                            <h3 className="font-black text-gray-900 text-base">{qrModalItem.title}</h3>
                            <p className="text-xs text-gray-500">{programmeTitle}</p>
                        </div>

                        <div className="flex justify-center p-3 bg-white rounded-2xl border-2 border-emerald-100 shadow-inner">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrModalItem.url)}`}
                                alt={qrModalItem.title}
                                className="w-56 h-56 rounded-xl object-contain"
                            />
                        </div>

                        <p className="text-[11px] text-gray-400 font-mono truncate px-2">
                            {qrModalItem.url}
                        </p>

                        <div className="flex items-center justify-center gap-2 pt-2">
                            <Button 
                                onClick={() => copyToClipboard(qrModalItem.url, qrModalItem.title)} 
                                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl gap-1.5"
                            >
                                <Copy className="w-3.5 h-3.5" /> Copy Link
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => setQrModalItem(null)}
                                className="font-semibold text-xs rounded-xl"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

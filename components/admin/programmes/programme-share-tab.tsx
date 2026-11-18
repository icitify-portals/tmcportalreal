"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
    Share2, 
    Copy, 
    Check, 
    ExternalLink, 
    QrCode, 
    MessageCircle, 
    Send, 
    Download, 
    Link as LinkIcon,
    Sparkles,
    ShieldCheck,
    Calendar,
    Utensils,
    Eye,
    Store,
    Award,
    Radio,
    Megaphone,
    Hash,
    Tv
} from "lucide-react"
import { generateWaiverLink } from "@/lib/actions/programmes"

interface ProgrammeShareTabProps {
    programme: {
        id: string
        title: string
        venue?: string | null
        startDate?: Date | string | null
        endDate?: Date | string | null
        amount?: string | number | null
        paymentRequired?: boolean | null
        isVirtual?: boolean | null
        format?: string | null
        level?: string | null
        state?: string | null
    }
}

export function ProgrammeShareTab({ programme }: ProgrammeShareTabProps) {
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
    const [copiedInvite, setCopiedInvite] = useState(false)
    const [origin, setOrigin] = useState("")
    const [waiverUrl, setWaiverUrl] = useState<string | null>(null)
    const [generatingWaiver, setGeneratingWaiver] = useState(false)
    const [campQrItem, setCampQrItem] = useState<{ title: string; url: string } | null>(null)

    useEffect(() => {
        if (typeof window !== "undefined") {
            setOrigin(window.location.origin)
        }
    }, [])

    const directRegisterUrl = origin ? `${origin}/programmes/${programme.id}/register` : `/programmes/${programme.id}/register`
    const shortUrl = origin ? `${origin}/programmes/${programme.id}` : `/programmes/${programme.id}`
    const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(directRegisterUrl)}`

    // Extract potential acronym for display
    const titleUpper = programme.title.toUpperCase()
    let acronymAlias: string | null = null
    if (titleUpper.includes("NITP") || titleUpper.includes("NATIONAL ISLAMIC TRAINING")) {
        acronymAlias = origin ? `${origin}/programmes/nitp` : "/programmes/nitp"
    } else if (titleUpper.includes("ITP") || titleUpper.includes("ISLAMIC TRAINING PROGRAMME")) {
        acronymAlias = origin ? `${origin}/programmes/itp` : "/programmes/itp"
    } else if (titleUpper.includes("NLW") || titleUpper.includes("NATIONAL LEADERSHIP")) {
        acronymAlias = origin ? `${origin}/programmes/nlw` : "/programmes/nlw"
    }

    // Format readable date
    let dateStr = "To be announced"
    if (programme.startDate) {
        try {
            dateStr = new Date(programme.startDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            })
        } catch {
            dateStr = String(programme.startDate)
        }
    }

    const feeStr = programme.paymentRequired && programme.amount && Number(programme.amount) > 0
        ? `₦${Number(programme.amount).toLocaleString()}`
        : "Free Entry"

    const inviteMessage = `Assalamu alaykum wa rahmatullah.

You are cordially invited to register for:
📌 *${programme.title}*

📅 *Date:* ${dateStr}
📍 *Venue:* ${programme.venue || "Announced soon"}
🏷️ *Level:* ${programme.level || "General"}
💰 *Registration Fee:* ${feeStr}

👉 *Register directly with one click here:*
${directRegisterUrl}

Spread the word to friends and family!`

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedUrl(text)
            toast.success(`${label} copied to clipboard!`)
            setTimeout(() => setCopiedUrl(null), 2500)
        } catch (e) {
            toast.error("Failed to copy link")
        }
    }

    const copyInviteMessage = async () => {
        try {
            await navigator.clipboard.writeText(inviteMessage)
            setCopiedInvite(true)
            toast.success("Broadcast message copied to clipboard!")
            setTimeout(() => setCopiedInvite(false), 2500)
        } catch (e) {
            toast.error("Failed to copy message")
        }
    }

    const shareToWhatsApp = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`
        window.open(url, "_blank")
    }

    const shareToTelegram = () => {
        const url = `https://t.me/share/url?url=${encodeURIComponent(directRegisterUrl)}&text=${encodeURIComponent(`Register for ${programme.title}`)}`
        window.open(url, "_blank")
    }

    const shareNative = async () => {
        if (typeof navigator !== "undefined" && navigator.share) {
            try {
                await navigator.share({
                    title: programme.title,
                    text: `Register for ${programme.title}`,
                    url: directRegisterUrl,
                })
            } catch (err) {
                // User cancelled or unsupported
            }
        } else {
            copyToClipboard(directRegisterUrl, "Registration link")
        }
    }

    const downloadQrCode = async () => {
        try {
            const response = await fetch(qrCodeApiUrl)
            const blob = await response.blob()
            const blobUrl = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = blobUrl
            a.download = `QR-${programme.title.replace(/[^a-zA-Z0-9]/g, "_")}.png`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(blobUrl)
            toast.success("QR code downloaded")
        } catch (err) {
            window.open(qrCodeApiUrl, "_blank")
        }
    }

    const handleGenerateWaiver = async () => {
        setGeneratingWaiver(true)
        try {
            const res = await generateWaiverLink(programme.id)
            if (res.success && res.url) {
                setWaiverUrl(res.url)
                await navigator.clipboard.writeText(res.url)
                toast.success("Priority waiver link generated and copied!")
            } else {
                toast.error(res.error || "Failed to generate waiver link")
            }
        } catch (e) {
            toast.error("Error generating waiver link")
        } finally {
            setGeneratingWaiver(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Top Overview Banner */}
            <div className="rounded-2xl border border-emerald-800/50 bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-slate-950 p-6 text-white shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-semibold px-2.5 py-0.5">
                                Public Registration Hub
                            </Badge>
                            {programme.format && (
                                <Badge variant="outline" className="border-emerald-600 text-emerald-200 text-xs">
                                    {programme.format}
                                </Badge>
                            )}
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                            Shareable Registration Links for {programme.title}
                        </h3>
                        <p className="text-sm text-emerald-200/90 leading-relaxed">
                            Attendees can click these direct links to register instantly for this programme without having to browse or search the general catalogue.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button 
                            onClick={shareToWhatsApp}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs shadow-sm h-9"
                        >
                            <MessageCircle className="h-4 w-4 mr-1.5" />
                            Share on WhatsApp
                        </Button>
                        <Button 
                            onClick={shareNative}
                            variant="outline"
                            className="border-emerald-500/60 bg-emerald-950/60 hover:bg-emerald-800 text-white font-semibold text-xs h-9"
                        >
                            <Share2 className="h-4 w-4 mr-1.5 text-emerald-400" />
                            Share Options
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Columns: Links & Invite Text */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Primary Registration Links Card */}
                    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                <LinkIcon className="h-4 w-4 text-emerald-600" />
                                Direct Registration URLs
                            </CardTitle>
                            <CardDescription>
                                Copy and distribute these URLs across WhatsApp groups, email broadcasts, SMS, or flyers.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Standard Registration Link */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                        Primary Registration Link (Direct Form)
                                    </Label>
                                    <span className="text-[11px] text-emerald-600 font-semibold">Recommended for publicity</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        readOnly
                                        value={directRegisterUrl}
                                        className="font-mono text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-200"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() => copyToClipboard(directRegisterUrl, "Primary registration link")}
                                        className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-9"
                                    >
                                        {copiedUrl === directRegisterUrl ? (
                                            <>
                                                <Check className="h-4 w-4 mr-1" /> Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-4 w-4 mr-1" /> Copy Link
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        asChild
                                        className="shrink-0 h-9"
                                    >
                                        <a href={directRegisterUrl} target="_blank" rel="noopener noreferrer" title="Open in new tab">
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </Button>
                                </div>
                            </div>

                            {/* Short URL / Alias */}
                            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    Short Link (Auto-redirect)
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        readOnly
                                        value={shortUrl}
                                        className="font-mono text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyToClipboard(shortUrl, "Short link")}
                                        className="shrink-0 h-9"
                                    >
                                        {copiedUrl === shortUrl ? (
                                            <>
                                                <Check className="h-4 w-4 mr-1 text-emerald-600" /> Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-4 w-4 mr-1" /> Copy
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Vanity / Acronym link if applicable (like NITP) */}
                            {acronymAlias && (
                                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                            Vanity Shortcut URL
                                        </Label>
                                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                                            Easy to remember
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            readOnly
                                            value={acronymAlias}
                                            className="font-mono text-xs bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 border-emerald-200"
                                        />
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => copyToClipboard(acronymAlias!, "Vanity shortcut link")}
                                            className="shrink-0 h-9 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                                        >
                                            {copiedUrl === acronymAlias ? (
                                                <>
                                                    <Check className="h-4 w-4 mr-1 text-emerald-600" /> Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="h-4 w-4 mr-1" /> Copy
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pre-crafted WhatsApp / Telegram Broadcast Message */}
                    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                    <MessageCircle className="h-4 w-4 text-green-600" />
                                    Ready-to-Send Broadcast Invitation
                                </CardTitle>
                                <Button
                                    size="sm"
                                    onClick={copyInviteMessage}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-8 text-xs"
                                >
                                    {copiedInvite ? (
                                        <>
                                            <Check className="h-3.5 w-3.5 mr-1" /> Copied Text
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-3.5 w-3.5 mr-1" /> Copy Message
                                        </>
                                    )}
                                </Button>
                            </div>
                            <CardDescription>
                                Copy this formatted text to paste directly into WhatsApp, Telegram, or SMS.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Textarea
                                readOnly
                                rows={8}
                                value={inviteMessage}
                                className="font-mono text-xs bg-slate-50 dark:bg-slate-950 leading-relaxed text-slate-800 dark:text-slate-200 resize-none selection:bg-emerald-200"
                            />
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                <Button
                                    size="sm"
                                    onClick={shareToWhatsApp}
                                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold h-8"
                                >
                                    <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Open in WhatsApp
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={shareToTelegram}
                                    variant="outline"
                                    className="border-blue-400 text-blue-600 hover:bg-blue-50 text-xs font-semibold h-8"
                                >
                                    <Send className="h-3.5 w-3.5 mr-1.5" /> Share to Telegram
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Priority Waiver Link (For VIPs / Exemptions) */}
                    <Card className="border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
                                <div>
                                    <CardTitle className="text-sm font-bold text-amber-950 dark:text-amber-200">
                                        Priority / Payment-Waived Registration Link
                                    </CardTitle>
                                    <CardDescription className="text-amber-800/80 dark:text-amber-300/80 text-xs">
                                        For VIP guests, special delegates, or members who paid offline whose fee is waived by admin.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {waiverUrl ? (
                                <div className="flex items-center gap-2">
                                    <Input
                                        readOnly
                                        value={waiverUrl}
                                        className="font-mono text-xs bg-white dark:bg-slate-950 border-amber-300"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() => copyToClipboard(waiverUrl, "Waiver registration link")}
                                        className="bg-amber-600 hover:bg-amber-700 text-white font-semibold h-9 shrink-0"
                                    >
                                        <Copy className="h-4 w-4 mr-1" /> Copy Waiver Link
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    size="sm"
                                    onClick={handleGenerateWaiver}
                                    disabled={generatingWaiver}
                                    variant="outline"
                                    className="border-amber-400 bg-white text-amber-900 hover:bg-amber-100 font-semibold text-xs h-9"
                                >
                                    <ShieldCheck className="h-4 w-4 mr-1.5 text-amber-600" />
                                    {generatingWaiver ? "Generating..." : "Generate Priority Waiver Link"}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: QR Code Card */}
                <div className="space-y-6">
                    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 text-center">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-bold flex items-center justify-center gap-2 text-slate-900 dark:text-slate-100">
                                <QrCode className="h-4 w-4 text-emerald-600" />
                                Registration QR Code
                            </CardTitle>
                            <CardDescription>
                                Place this QR code on event banners, posters, and PowerPoint slides for quick mobile registration.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-2">
                            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs inline-block mx-auto">
                                <img
                                    src={qrCodeApiUrl}
                                    alt={`Registration QR code for ${programme.title}`}
                                    className="w-48 h-48 md:w-56 md:h-56 mx-auto object-contain"
                                    loading="lazy"
                                />
                            </div>

                            <div className="text-xs text-slate-500 font-medium">
                                Attendees scan with any phone camera to open the direct registration page.
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                                <Button
                                    onClick={downloadQrCode}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 shadow-xs"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download High-Res QR Code (PNG)
                                </Button>
                                <Button
                                    variant="outline"
                                    asChild
                                    className="w-full text-xs font-semibold h-9"
                                >
                                    <a href={`/dashboard/admin/programmes/${programme.id}/poster`} target="_blank">
                                        View Generated Poster with QR
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Specs Card */}
                    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50/50 dark:bg-slate-900/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Programme Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2.5 text-xs">
                            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800">
                                <span className="text-slate-500">Date:</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{dateStr}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800">
                                <span className="text-slate-500">Venue:</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{programme.venue || "TBD"}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800">
                                <span className="text-slate-500">Fee:</span>
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{feeStr}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                                <span className="text-slate-500">Jurisdiction:</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{programme.level || "National"}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Camp Operations & Delegate Services Share Section */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-600 text-white font-bold text-xs">Live Camp Operations</Badge>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                            Delegate Service Links & Broadcast Announcements
                        </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Disseminate these specialized links to registered camp delegates via WhatsApp or display their QR codes across camp venues.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        {
                            title: "Live Event Schedule & Ticker",
                            path: `/programmes/${programme.id}/schedule`,
                            icon: Calendar,
                            desc: "Daily lecture timeline, speaker list, and live announcement ticker.",
                            waText: `Assalamu alaykum.\n\n📌 *${programme.title}*\n📅 *Live Event Schedule & Announcement Ticker*\nTrack upcoming sessions, venue changes, and live announcements on the go:\n${origin}/programmes/${programme.id}/schedule`
                        },
                        {
                            title: "Food Timetable & Meal Ratings",
                            path: `/programmes/${programme.id}/meals`,
                            icon: Utensils,
                            desc: "Daily menu for Breakfast, Lunch & Dinner, plus interactive meal quality ratings.",
                            waText: `Assalamu alaykum.\n\n📌 *${programme.title}*\n🍽️ *Food Timetable & Meal Ratings*\nCheck what is on the menu for Breakfast, Lunch & Dinner, and rate the food quality:\n${origin}/programmes/${programme.id}/meals`
                        },
                        {
                            title: "\"As I See It\" Observation Box",
                            path: `/programmes/${programme.id}/as-i-see-it`,
                            icon: Eye,
                            desc: "Real-time suggestion box for delegates with anonymous mode and leadership triage.",
                            waText: `Assalamu alaykum.\n\n📌 *${programme.title}*\n👁️ *\"As I See It\" Observation Box*\nShare your real-time observations, facilities issues, and suggestions directly with the camp leadership:\n${origin}/programmes/${programme.id}/as-i-see-it`
                        },
                        {
                            title: "Camp Bazaar & Vendor Directory",
                            path: `/programmes/${programme.id}/vendors`,
                            icon: Store,
                            desc: "Explore camp bookshops, attire vendors, perfumes, herbal products, and food stalls.",
                            waText: `Assalamu alaykum.\n\n📌 *${programme.title}*\n🏪 *Camp Bazaar & Vendor Directory*\nBrowse official stalls, books, attires, and contact vendors directly on WhatsApp:\n${origin}/programmes/${programme.id}/vendors`
                        },
                        {
                            title: "Departmental KPI Assessment",
                            path: `/programmes/${programme.id}/departments/assess`,
                            icon: Award,
                            desc: "Participant assessment of 10 camp directorates across 4 KPI performance dimensions.",
                            waText: `Assalamu alaykum.\n\n📌 *${programme.title}*\n🏆 *Departmental KPI Assessment*\nRate the efficiency, quality, and service conduct of camp directorates and committees:\n${origin}/programmes/${programme.id}/departments/assess`
                        },
                        {
                            title: "Camp Broadcasts & Noticeboard",
                            path: `/programmes/${programme.id}/announcements`,
                            icon: Megaphone,
                            desc: "Read official camp circulars, urgent directives, prayer timings, and lost & found notices.",
                            waText: `Assalamu alaykum.\n\n📌 *${programme.title}*\n📢 *Official Camp Noticeboard & Directives*\nStay updated on all camp announcements, lost & found alerts, and official circulars:\n${origin}/programmes/${programme.id}/announcements`
                        },
                        {
                            title: "Officer & Zonal Channels",
                            path: `/programmes/${programme.id}/channels`,
                            icon: Hash,
                            desc: "Structured in-portal rooms for Departmental and Zonal/State officers.",
                            waText: `Assalamu alaykum.\n\n📌 *${programme.title}*\n💬 *Officer & Zonal Interaction Channels*\nCoordinate directly with fellow officers in your Zone or Directorate inside the portal:\n${origin}/programmes/${programme.id}/channels`
                        },
                        {
                            title: "Virtual Participants Hub",
                            path: `/programmes/${programme.id}/virtual`,
                            icon: Tv,
                            desc: "Live video/audio stream player, virtual attendance marking, handouts, and online Q&A.",
                            waText: `Assalamu alaykum.\n\n📌 *${programme.title}*\n📺 *Virtual Participants Hub*\nJoin the livestream, mark online session attendance, download slides, and ask questions:\n${origin}/programmes/${programme.id}/virtual`
                        },
                    ].map((item, idx) => {
                        const fullUrl = `${origin}${item.path}`
                        const isCopied = copiedUrl === fullUrl
                        return (
                            <Card key={idx} className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden bg-white dark:bg-slate-900">
                                <CardContent className="p-4 space-y-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800 shrink-0">
                                            <item.icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                                                {item.title}
                                            </h4>
                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Delegate Link</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300">
                                        {item.desc}
                                    </p>
                                    <div className="p-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-600 dark:text-slate-300 truncate">
                                        {fullUrl}
                                    </div>
                                </CardContent>
                                <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyToClipboard(fullUrl, item.title)}
                                        className="h-8 text-xs font-semibold rounded-xl flex-1"
                                    >
                                        {isCopied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                                        {isCopied ? "Copied" : "Copy Link"}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(item.waText)}`, "_blank")}
                                        className="h-8 px-2.5 text-xs rounded-xl text-green-700 hover:bg-green-50 border-green-200"
                                        title="Share via WhatsApp"
                                    >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setCampQrItem({ title: item.title, url: fullUrl })}
                                        className="h-8 px-2.5 text-xs rounded-xl"
                                        title="View QR Code"
                                    >
                                        <QrCode className="w-3.5 h-3.5" />
                                    </Button>
                                    <a href={item.path} target="_blank" rel="noreferrer">
                                        <Button size="sm" variant="ghost" className="h-8 px-2 text-xs rounded-xl text-slate-500" title="Open Page">
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </Button>
                                    </a>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {/* QR Modal for Camp Services */}
            {campQrItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-gray-200 text-center">
                        <div className="border-b pb-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Delegate Direct Access QR</p>
                            <h3 className="font-black text-gray-900 text-base">{campQrItem.title}</h3>
                            <p className="text-xs text-gray-500">{programme.title}</p>
                        </div>

                        <div className="flex justify-center p-3 bg-white rounded-2xl border-2 border-emerald-100 shadow-inner">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(campQrItem.url)}`}
                                alt={campQrItem.title}
                                className="w-56 h-56 rounded-xl object-contain"
                            />
                        </div>

                        <p className="text-[11px] text-gray-400 font-mono truncate px-2">
                            {campQrItem.url}
                        </p>

                        <div className="flex items-center justify-center gap-2 pt-2">
                            <Button 
                                onClick={() => copyToClipboard(campQrItem.url, campQrItem.title)} 
                                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl gap-1.5"
                            >
                                <Copy className="w-3.5 h-3.5" /> Copy Link
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => setCampQrItem(null)}
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

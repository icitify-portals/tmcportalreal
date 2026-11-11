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
    ShieldCheck
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
        </div>
    )
}

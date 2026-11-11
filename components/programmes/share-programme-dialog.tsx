"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { 
    Share2, 
    Copy, 
    Check, 
    ExternalLink, 
    QrCode, 
    MessageCircle, 
    Send, 
    Download 
} from "lucide-react"

export interface ShareProgrammeDialogProps {
    programme: {
        id: string
        title: string
        venue?: string | null
        startDate?: Date | string | null
        amount?: string | number | null
        paymentRequired?: boolean | null
        isVirtual?: boolean | null
        format?: string | null
    }
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    buttonVariant?: "default" | "outline" | "secondary" | "ghost"
    buttonSize?: "sm" | "default" | "lg"
    className?: string
    showLabel?: boolean
}

export function ShareProgrammeDialog({
    programme,
    trigger,
    open,
    onOpenChange,
    buttonVariant = "outline",
    buttonSize = "sm",
    className,
    showLabel = true,
}: ShareProgrammeDialogProps) {
    const [copiedLink, setCopiedLink] = useState(false)
    const [copiedText, setCopiedText] = useState(false)
    const [showQr, setShowQr] = useState(false)

    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const registrationUrl = `${origin}/programmes/${programme.id}/register`
    const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(registrationUrl)}`

    // Format readable date
    let dateStr = "TBD"
    if (programme.startDate) {
        try {
            dateStr = new Date(programme.startDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            })
        } catch (e) {
            dateStr = String(programme.startDate)
        }
    }

    const feeStr = programme.paymentRequired && programme.amount && Number(programme.amount) > 0
        ? `₦${Number(programme.amount).toLocaleString()}`
        : "Free Entry"

    const shareMessage = `Assalamu alaykum.\n\nYou are invited to register for "${programme.title}".\n\n📅 Date: ${dateStr}\n📍 Venue: ${programme.venue || "Announced soon"}\n💰 Fee: ${feeStr}\n\n👉 Register directly here:\n${registrationUrl}`

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(registrationUrl)
            setCopiedLink(true)
            toast.success("Direct registration link copied to clipboard!")
            setTimeout(() => setCopiedLink(false), 2000)
        } catch (err) {
            toast.error("Failed to copy link")
        }
    }

    const handleCopyMessage = async () => {
        try {
            await navigator.clipboard.writeText(shareMessage)
            setCopiedText(true)
            toast.success("Complete invitation text copied!")
            setTimeout(() => setCopiedText(false), 2000)
        } catch (err) {
            toast.error("Failed to copy text")
        }
    }

    const handleWhatsAppShare = () => {
        const waUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`
        window.open(waUrl, "_blank")
    }

    const handleTelegramShare = () => {
        const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(registrationUrl)}&text=${encodeURIComponent(`Register for ${programme.title}`)}`
        window.open(tgUrl, "_blank")
    }

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: programme.title,
                    text: shareMessage,
                    url: registrationUrl,
                })
                toast.success("Shared successfully!")
            } catch (err: any) {
                if (err.name !== "AbortError") {
                    handleCopyLink()
                }
            }
        } else {
            handleCopyLink()
        }
    }

    const dialogProps = open !== undefined ? { open, onOpenChange } : {}

    return (
        <Dialog {...dialogProps}>
            {trigger !== undefined ? (
                trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null
            ) : (
                <DialogTrigger asChild>
                    <Button
                        variant={buttonVariant}
                        size={buttonSize}
                        className={className}
                        title="Share Programme Registration Link"
                    >
                        <Share2 className="h-3.5 w-3.5 mr-1.5" />
                        {showLabel && <span>Share Link</span>}
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <Share2 className="h-5 w-5 text-emerald-600" />
                        Share Programme Registration Link
                    </DialogTitle>
                    <DialogDescription>
                        Direct registration link for <strong>{programme.title}</strong>. Users clicking this link go straight to the registration form.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    {/* Direct Link Input */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground">
                            Registration Link
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                value={registrationUrl}
                                readOnly
                                className="font-mono text-xs bg-muted/50 select-all"
                            />
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleCopyLink}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 shrink-0"
                            >
                                {copiedLink ? (
                                    <>
                                        <Check className="h-4 w-4" />
                                        <span>Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" />
                                        <span>Copy</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Quick Sharing Buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleWhatsAppShare}
                            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 gap-1.5"
                        >
                            <MessageCircle className="h-4 w-4 text-green-600" />
                            WhatsApp
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleTelegramShare}
                            className="bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200 gap-1.5"
                        >
                            <Send className="h-4 w-4 text-sky-600" />
                            Telegram
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowQr(!showQr)}
                            className="gap-1.5"
                        >
                            <QrCode className="h-4 w-4 text-purple-600" />
                            {showQr ? "Hide QR" : "Show QR Code"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleNativeShare}
                            className="gap-1.5"
                        >
                            <ExternalLink className="h-4 w-4" />
                            More Options
                        </Button>
                    </div>

                    {/* QR Code Section */}
                    {showQr && (
                        <div className="p-4 bg-muted/40 border rounded-xl flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={qrCodeApiUrl}
                                alt="Registration QR Code"
                                className="w-48 h-48 border rounded-lg bg-white p-2 shadow-sm"
                            />
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">Scan with phone camera to register</p>
                                <a
                                    href={qrCodeApiUrl}
                                    download={`${programme.title}-qr.png`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-emerald-700 hover:underline font-semibold inline-flex items-center gap-1 mt-1"
                                >
                                    <Download className="h-3 w-3" />
                                    Download QR for Flyers
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Formatted Invitation Text */}
                    <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold uppercase text-muted-foreground">
                                Ready-to-Send Invitation Message
                            </Label>
                            <button
                                type="button"
                                onClick={handleCopyMessage}
                                className="text-xs text-emerald-700 hover:underline flex items-center gap-1 font-medium"
                            >
                                {copiedText ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                                {copiedText ? "Copied" : "Copy Message"}
                            </button>
                        </div>
                        <Textarea
                            value={shareMessage}
                            readOnly
                            rows={5}
                            className="text-xs font-sans bg-muted/30 resize-none leading-relaxed"
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Hash,
    Send,
    Pin,
    Shield,
    Building2,
    MapPin,
    RefreshCw,
    Paperclip,
    UserCheck,
    Users,
    MessageSquare
} from "lucide-react"
import { toast } from "sonner"
import {
    getProgrammeChannelMessages,
    postProgrammeChannelMessage,
    togglePinChannelMessage
} from "@/lib/actions/programme-camp-ops"

export interface ChannelItem {
    key: string
    label: string
    type: "COMMAND" | "DEPARTMENT" | "ZONE"
    description: string
}

export const CAMP_CHANNELS: ChannelItem[] = [
    // Command
    { key: "GENERAL_COMMAND", label: "Central Camp Command Room", type: "COMMAND", description: "Cross-departmental coordination for Amirs, Directors, and Desk Heads." },

    // Departments
    { key: "DEPT_DAWAH", label: "Dawah & Lectures", type: "DEPARTMENT", description: "Speaker protocols, lecture moderation, and masjid timings." },
    { key: "DEPT_WELFARE", label: "Welfare & Feeding", type: "DEPARTMENT", description: "Kitchen operations, ration allocation, water & dining logistics." },
    { key: "DEPT_ACCOMMODATION", label: "Accommodation & Bedding", type: "DEPARTMENT", description: "Hostel allocation, hall space, mattresses & facility care." },
    { key: "DEPT_SECURITY", label: "Security & Gate Control", type: "DEPARTMENT", description: "Main gate passes, perimeter patrols, visitor clearance & safety." },
    { key: "DEPT_MEDICAL", label: "Medical & Clinic", type: "DEPARTMENT", description: "First aid, ambulance standby, patient triage & pharmacy." },
    { key: "DEPT_LOGISTICS", label: "Logistics, Sound & Power", type: "DEPARTMENT", description: "Generators, PA audio systems, tents, lighting & transport." },
    { key: "DEPT_MEDIA_IT", label: "Media, Stream & IT", type: "DEPARTMENT", description: "Livestreams, camera crew, portal tech desk & social publicity." },
    { key: "DEPT_FINANCE", label: "Finance & Registration", type: "DEPARTMENT", description: "Payment reconciliation, bulk/sponsor codes & registration support." },
    { key: "DEPT_BAZAAR", label: "Bazaar & Stalls", type: "DEPARTMENT", description: "Market pavilion stands, vendor permits & trade compliance." },
    { key: "DEPT_DISCIPLINE", label: "Discipline & Marshals", type: "DEPARTMENT", description: "Delegate order, lights-out compliance & programme etiquette." },

    // Zones / States
    { key: "ZONE_LAGOS", label: "Lagos Zone Officers", type: "ZONE", description: "Coordination room for Lagos State & branch delegates." },
    { key: "ZONE_OGUN", label: "Ogun Zone Officers", type: "ZONE", description: "Coordination room for Ogun State & branch delegates." },
    { key: "ZONE_OYO", label: "Oyo Zone Officers", type: "ZONE", description: "Coordination room for Oyo State & branch delegates." },
    { key: "ZONE_OSUN", label: "Osun Zone Officers", type: "ZONE", description: "Coordination room for Osun State & branch delegates." },
    { key: "ZONE_KWARA", label: "Kwara Zone Officers", type: "ZONE", description: "Coordination room for Kwara State & branch delegates." },
    { key: "ZONE_ONDO_EKITI", label: "Ondo / Ekiti Officers", type: "ZONE", description: "Coordination room for Ondo & Ekiti delegates." },
    { key: "ZONE_EDO_DELTA", label: "Edo / Delta Officers", type: "ZONE", description: "Coordination room for Edo & Delta delegates." },
    { key: "ZONE_NORTH", label: "Abuja & Northern Zone", type: "ZONE", description: "Coordination room for FCT & Northern states." },
    { key: "ZONE_BENIN", label: "Benin Republic Zone", type: "ZONE", description: "Coordination room for Benin Republic departments & branches." },
]

export function OfficerChannelsWorkspace({
    programmeId,
    programmeTitle,
    defaultSenderName = "",
    defaultSenderRole = "Officer / Coordinator",
    canPin = false,
}: {
    programmeId: string
    programmeTitle?: string
    defaultSenderName?: string
    defaultSenderRole?: string
    canPin?: boolean
}) {
    const [activeChannel, setActiveChannel] = useState<ChannelItem>(CAMP_CHANNELS[0])
    const [messages, setMessages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Composer
    const [senderName, setSenderName] = useState(defaultSenderName)
    const [senderRole, setSenderRole] = useState(defaultSenderRole)
    const [content, setContent] = useState("")
    const [attachmentUrl, setAttachmentUrl] = useState("")
    const [pinMessage, setPinMessage] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [showAttachmentInput, setShowAttachmentInput] = useState(false)

    const feedRef = useRef<HTMLDivElement>(null)

    const loadMessages = async (channelKey: string, silent = false) => {
        if (!silent) setLoading(true)
        const res = await getProgrammeChannelMessages(programmeId, channelKey)
        if (res.success) {
            setMessages(res.data)
        }
        if (!silent) setLoading(false)
    }

    useEffect(() => {
        loadMessages(activeChannel.key)
        const timer = setInterval(() => {
            loadMessages(activeChannel.key, true)
        }, 15000)
        return () => clearInterval(timer)
    }, [programmeId, activeChannel.key])

    useEffect(() => {
        if (feedRef.current) {
            feedRef.current.scrollTop = feedRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim()) return
        if (!senderName.trim()) {
            toast.error("Please enter your Name so officers know who posted")
            return
        }

        setIsSending(true)
        const res = await postProgrammeChannelMessage({
            programmeId,
            channelType: activeChannel.type,
            channelKey: activeChannel.key,
            channelLabel: activeChannel.label,
            senderName,
            senderRole,
            content,
            attachmentUrl: attachmentUrl.trim() || undefined,
            isPinned: pinMessage,
        })

        if (res.success) {
            setContent("")
            setAttachmentUrl("")
            setPinMessage(false)
            setShowAttachmentInput(false)
            await loadMessages(activeChannel.key, true)
        } else {
            toast.error(res.error || "Failed to send message")
        }
        setIsSending(false)
    }

    const handleTogglePin = async (msgId: string, currentPinned: boolean) => {
        const res = await togglePinChannelMessage(msgId, !currentPinned)
        if (res.success) {
            toast.success(!currentPinned ? "Pinned to channel header" : "Unpinned")
            loadMessages(activeChannel.key, true)
        } else {
            toast.error("Failed to toggle pin")
        }
    }

    const pinnedMessages = messages.filter(m => m.isPinned)
    const commandChannels = CAMP_CHANNELS.filter(c => c.type === "COMMAND")
    const deptChannels = CAMP_CHANNELS.filter(c => c.type === "DEPARTMENT")
    const zoneChannels = CAMP_CHANNELS.filter(c => c.type === "ZONE")

    return (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[650px]">
            {/* Left Sidebar: Channels List */}
            <aside className="lg:col-span-4 xl:col-span-3 bg-slate-900 text-slate-100 p-4 flex flex-col gap-4 border-r border-slate-800 max-h-[750px] overflow-y-auto">
                <div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-bold uppercase mb-1">
                        Officer Coordination Hub
                    </Badge>
                    <h2 className="text-sm font-black text-white leading-tight truncate">
                        {programmeTitle || "Camp Programme"}
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                        In-portal alternative to scattered WhatsApp groups.
                    </p>
                </div>

                {/* Mobile quick select */}
                <div className="lg:hidden">
                    <Label className="text-[11px] text-slate-400 font-bold mb-1 block">Switch Room / Channel</Label>
                    <select
                        value={activeChannel.key}
                        onChange={(e) => {
                            const found = CAMP_CHANNELS.find(c => c.key === e.target.value)
                            if (found) setActiveChannel(found)
                        }}
                        className="w-full h-9 rounded-xl bg-slate-800 border border-slate-700 text-white px-3 text-xs font-bold"
                    >
                        {CAMP_CHANNELS.map(c => (
                            <option key={c.key} value={c.key}>
                                [{c.type}] {c.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="hidden lg:block space-y-5">
                    {/* Command */}
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                            <Shield className="w-3 h-3 text-amber-400" /> Command Center
                        </p>
                        {commandChannels.map(ch => (
                            <button
                                key={ch.key}
                                type="button"
                                onClick={() => setActiveChannel(ch)}
                                className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
                                    activeChannel.key === ch.key
                                        ? "bg-emerald-700 text-white"
                                        : "text-slate-300 hover:bg-slate-800"
                                }`}
                            >
                                <Hash className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                <span className="truncate">{ch.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Departments */}
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 text-emerald-400" /> Departmental Rooms
                        </p>
                        {deptChannels.map(ch => (
                            <button
                                key={ch.key}
                                type="button"
                                onClick={() => setActiveChannel(ch)}
                                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors ${
                                    activeChannel.key === ch.key
                                        ? "bg-emerald-700 text-white font-bold"
                                        : "text-slate-300 hover:bg-slate-800"
                                }`}
                            >
                                <Hash className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                <span className="truncate">{ch.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Zones */}
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-blue-400" /> Zonal / State Rooms
                        </p>
                        {zoneChannels.map(ch => (
                            <button
                                key={ch.key}
                                type="button"
                                onClick={() => setActiveChannel(ch)}
                                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors ${
                                    activeChannel.key === ch.key
                                        ? "bg-emerald-700 text-white font-bold"
                                        : "text-slate-300 hover:bg-slate-800"
                                }`}
                            >
                                <Hash className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                <span className="truncate">{ch.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Right Main Chat Pane */}
            <section className="lg:col-span-8 xl:col-span-9 flex flex-col bg-gray-50/40 max-h-[750px]">
                {/* Channel Header */}
                <div className="bg-white border-b border-gray-200 px-5 py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <Hash className="w-5 h-5 text-emerald-700 shrink-0" />
                            <h3 className="text-base font-black text-gray-900 truncate">{activeChannel.label}</h3>
                            <Badge variant="outline" className="text-[10px] font-bold">
                                {activeChannel.type}
                            </Badge>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{activeChannel.description}</p>
                    </div>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadMessages(activeChannel.key)}
                        className="rounded-xl text-xs h-8 shrink-0 gap-1"
                    >
                        <RefreshCw className="w-3.5 h-3.5" /> Sync
                    </Button>
                </div>

                {/* Pinned Directives Banner */}
                {pinnedMessages.length > 0 && (
                    <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
                            <Pin className="w-3 h-3" /> Pinned Officer Directive
                        </p>
                        {pinnedMessages.slice(-2).map(pm => (
                            <div key={pm.id} className="text-xs text-amber-950 font-medium flex items-center justify-between gap-2">
                                <span className="truncate">
                                    <strong>{pm.senderName}:</strong> {pm.content}
                                </span>
                                {canPin && (
                                    <button
                                        type="button"
                                        onClick={() => handleTogglePin(pm.id, true)}
                                        className="text-[10px] underline text-amber-700 shrink-0"
                                    >
                                        Unpin
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Messages Feed */}
                <div ref={feedRef} className="flex-1 overflow-y-auto p-5 space-y-3">
                    {loading ? (
                        <div className="text-center py-16 text-xs text-gray-400">
                            Loading channel discussion...
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-16 space-y-2">
                            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto" />
                            <p className="text-sm font-bold text-gray-700">Welcome to #{activeChannel.label}</p>
                            <p className="text-xs text-gray-400 max-w-sm mx-auto">
                                No updates posted here yet. Start coordinating duties, rosters, and camp happenings directly inside this room.
                            </p>
                        </div>
                    ) : (
                        messages.map(msg => (
                            <div
                                key={msg.id}
                                className={`p-3.5 rounded-2xl border shadow-2xs transition-colors ${
                                    msg.isPinned ? "bg-amber-50/40 border-amber-200" : "bg-white border-gray-200"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-black text-xs text-gray-900">{msg.senderName}</span>
                                        {msg.senderRole && (
                                            <Badge variant="secondary" className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border-emerald-100">
                                                {msg.senderRole}
                                            </Badge>
                                        )}
                                        <span className="text-[10px] text-gray-400">
                                            {new Date(msg.createdAt).toLocaleString([], {
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </div>

                                    {canPin && (
                                        <button
                                            type="button"
                                            onClick={() => handleTogglePin(msg.id, msg.isPinned)}
                                            className={`p-1 rounded hover:bg-gray-100 ${msg.isPinned ? "text-amber-600" : "text-gray-400"}`}
                                            title={msg.isPinned ? "Unpin" : "Pin message"}
                                        >
                                            <Pin className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {msg.content}
                                </p>

                                {msg.attachmentUrl && (
                                    <a
                                        href={msg.attachmentUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 font-bold hover:underline"
                                    >
                                        <Paperclip className="w-3.5 h-3.5" /> View Attached Roster / File
                                    </a>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Message Composer */}
                <form onSubmit={handleSend} className="bg-white border-t border-gray-200 p-4 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                            required
                            value={senderName}
                            onChange={(e) => setSenderName(e.target.value)}
                            placeholder="Your Full Name *"
                            className="h-8 text-xs rounded-xl bg-gray-50"
                        />
                        <Input
                            value={senderRole}
                            onChange={(e) => setSenderRole(e.target.value)}
                            placeholder="Designation (e.g. HOD Welfare, Zonal Amir)"
                            className="h-8 text-xs rounded-xl bg-gray-50"
                        />
                    </div>

                    {showAttachmentInput && (
                        <Input
                            value={attachmentUrl}
                            onChange={(e) => setAttachmentUrl(e.target.value)}
                            placeholder="Paste Google Drive / Document URL..."
                            className="h-8 text-xs rounded-xl"
                        />
                    )}

                    <div className="flex items-end gap-2">
                        <Textarea
                            required
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={`Post update or coordinate in #${activeChannel.label}...`}
                            rows={2}
                            className="text-xs rounded-2xl resize-none flex-1"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend(e as any)
                                }
                            }}
                        />
                        <div className="flex flex-col gap-1.5 shrink-0">
                            <Button
                                type="submit"
                                disabled={isSending}
                                className="h-9 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold gap-1.5"
                            >
                                <Send className="w-3.5 h-3.5" />
                                {isSending ? "Posting..." : "Post"}
                            </Button>
                            <div className="flex items-center justify-end gap-1">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setShowAttachmentInput(!showAttachmentInput)}
                                    className="h-6 px-1.5 text-[10px] text-gray-500"
                                    title="Attach link"
                                >
                                    <Paperclip className="w-3 h-3" />
                                </Button>
                                {canPin && (
                                    <label className="flex items-center gap-1 text-[10px] text-gray-600 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={pinMessage}
                                            onChange={(e) => setPinMessage(e.target.checked)}
                                            className="rounded w-3 h-3"
                                        />
                                        Pin
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                </form>
            </section>
        </div>
    )
}

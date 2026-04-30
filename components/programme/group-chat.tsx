"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Megaphone, Loader2 } from "lucide-react"
import { sendProgrammeMessage } from "@/lib/actions/programmes"
import { format } from "date-fns"
import { toast } from "sonner"

interface Message {
    id: string
    content: string
    createdAt: Date
    isAnnouncement: boolean
    user: {
        name: string
        image?: string | null
    }
}

interface GroupChatProps {
    programmeId: string
    initialMessages: any[]
    currentUserId: string
    isAdmin: boolean
}

export function GroupChat({ programmeId, initialMessages, currentUserId, isAdmin }: GroupChatProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [input, setInput] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [isAnnouncement, setIsAnnouncement] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    async function handleSend() {
        if (!input.trim() || isSending) return
        
        setIsSending(true)
        try {
            const res = await sendProgrammeMessage(programmeId, input, isAnnouncement)
            if (res.success) {
                // For a simple real-time feel, we could add locally, 
                // but revalidatePath should handle it if using polling or server actions correctly.
                // Here we just clear input and hope revalidation kicks in (or we could refetch).
                setInput("")
                setIsAnnouncement(false)
                toast.success("Message sent")
            } else {
                toast.error(res.error || "Failed to send")
            }
        } catch (e) {
            toast.error("An error occurred")
        } finally {
            setIsSending(false)
        }
    }

    return (
        <Card className="h-[600px] flex flex-col border-none shadow-none bg-transparent">
            <CardContent 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
            >
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 opacity-50">
                        <Megaphone className="w-12 h-12" />
                        <p className="font-bold uppercase tracking-widest text-xs">No messages yet. Start the conversation!</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`flex gap-3 ${msg.isAnnouncement ? 'justify-center w-full' : ''}`}
                    >
                        {msg.isAnnouncement ? (
                            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-6 py-3 rounded-2xl text-center max-w-[80%] shadow-sm">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <Megaphone className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Announcement</span>
                                </div>
                                <p className="text-sm font-bold text-amber-950">{msg.content}</p>
                                <p className="text-[10px] mt-2 text-amber-800 opacity-80 font-black">{format(new Date(msg.createdAt), 'p')}</p>
                            </div>
                        ) : (
                            <>
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={msg.user.image || ""} />
                                    <AvatarFallback className="bg-green-100 text-green-700 font-bold text-xs">
                                        {msg.user.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1 max-w-[80%]">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">{msg.user.name}</span>
                                        <span className="text-[8px] text-gray-400 font-bold">{format(new Date(msg.createdAt), 'p')}</span>
                                    </div>
                                    <div className="bg-white border-2 border-gray-100 rounded-2xl rounded-tl-none p-3 shadow-sm">
                                        <p className="text-sm text-black font-medium leading-relaxed">{msg.content}</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </CardContent>
            <CardFooter className="p-4 bg-white border-t rounded-b-xl gap-2">
                {isAdmin && (
                    <Button 
                        variant={isAnnouncement ? "default" : "outline"} 
                        size="icon"
                        className={isAnnouncement ? "bg-amber-600 hover:bg-amber-700" : "text-amber-600 hover:bg-amber-50"}
                        onClick={() => setIsAnnouncement(!isAnnouncement)}
                        title="Toggle Announcement Mode"
                    >
                        <Megaphone className="w-4 h-4" />
                    </Button>
                )}
                <Input 
                    placeholder={isAnnouncement ? "Post an announcement..." : "Type a message..."} 
                    className="flex-1 bg-gray-50 border-2 border-gray-200 h-12 rounded-xl focus-visible:ring-green-500 text-black font-bold placeholder:text-gray-500"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <Button 
                    className="bg-green-600 hover:bg-green-700 h-12 w-12 rounded-xl"
                    onClick={handleSend}
                    disabled={isSending || !input.trim()}
                >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
            </CardFooter>
        </Card>
    )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Send, ArrowLeft, Paperclip, X, File, Image as ImageIcon, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function ChatView({ chatId, chat, onBack, currentUserId }: any) {
    const [messages, setMessages] = useState<any[]>([])
    const [participants, setParticipants] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [attachment, setAttachment] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isSending, setIsSending] = useState(false)
    const [loadingMessages, setLoadingMessages] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/chats/${chatId}/messages`)
            if (res.ok) {
                const data = await res.json()
                setParticipants(data.participants)
                
                // Process messages
                const processed = data.messages.map((msg: any) => {
                    if (msg.type === 'E2AE') {
                        return { ...msg, isLegacyEncrypted: true }
                    }
                    // Parse payload if it's JSON
                    let payload;
                    try {
                        payload = JSON.parse(msg.content)
                    } catch (e) {
                        payload = { text: msg.content }
                    }
                    return { ...msg, payload }
                })
                setMessages(processed)
            }
        } catch (error) {
            console.error("Error fetching messages", error)
        } finally {
            setLoadingMessages(false)
        }
    }

    // Effect to update messages
    useEffect(() => {
        setLoadingMessages(true)
        fetchMessages()
        const interval = setInterval(fetchMessages, 5000)
        return () => clearInterval(interval)
    }, [chatId])


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() && !attachment) return

        setIsSending(true)
        try {
            let finalMediaUrl = ""
            if (attachment) {
                const formData = new FormData()
                formData.append("file", attachment, attachment.name)
                formData.append("category", "chat-media")
                
                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData
                })
                if (uploadRes.ok) {
                    const data = await uploadRes.json()
                    finalMediaUrl = data.url
                } else {
                    throw new Error("Failed to upload file")
                }
            }

            const payloadObj = {
                text: newMessage,
                mediaUrl: finalMediaUrl,
                mimeType: attachment?.type || "",
                fileName: attachment?.name || ""
            }

            const res = await fetch(`/api/chats/${chatId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: JSON.stringify(payloadObj),
                    type: "TEXT"
                })
            })

            if (res.ok) {
                setNewMessage("")
                setAttachment(null)
                if (fileInputRef.current) fileInputRef.current.value = ""
                fetchMessages()
            } else {
                const errData = await res.json()
                toast.error(errData.error || "Failed to send message")
                console.error("Message send error:", errData)
            }
        } catch (error) {
            console.error("Failed to send", error)
            toast.error("Failed to send message")
        } finally {
            setIsSending(false)
        }
    }

    const getChatName = () => {
        if (!chat) return "Chat"
        if (chat.isGroup) return chat.name || "Group"
        const other = chat.participants?.find((p: any) => p.id !== currentUserId)
        return other?.name || "Unknown User"
    }

    // 3. Main Chat View
    return (
        <Card className="h-full flex flex-col border-0 md:border">
            <CardHeader className="flex flex-row items-center gap-2 py-3 border-b">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <CardTitle className="text-base flex items-center gap-2">
                        {getChatName()}
                    </CardTitle>
                </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50 dark:bg-slate-900/20">
                {loadingMessages ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground mt-10">
                        No messages yet. Start a conversation!
                    </div>
                ) : (
                    messages.map((msg: any) => {
                        const isMe = msg.senderId === currentUserId

                        return (
                            <div key={msg.id} className={cn("flex max-w-[80%]", isMe ? "ml-auto flex-row-reverse" : "mr-auto")}>
                                <div className={cn(
                                    "p-3 rounded-lg text-sm",
                                    isMe ? "bg-primary text-primary-foreground rounded-br-none" : "bg-white dark:bg-muted border rounded-bl-none"
                                )}>
                                    {!isMe && <div className="text-xs font-bold mb-1 opacity-70">{msg.sender.name}</div>}

                                    {msg.isLegacyEncrypted ? (
                                        <div className="flex items-center gap-1 text-xs opacity-70 italic">
                                            <Lock className="h-3 w-3" /> [Legacy Encrypted Message]
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            {msg.payload?.mediaUrl && (
                                                <MediaItem 
                                                    mediaUrl={msg.payload.mediaUrl}
                                                    mimeType={msg.payload.mimeType}
                                                    fileName={msg.payload.fileName}
                                                />
                                            )}
                                            {msg.payload?.text && <div>{msg.payload.text}</div>}
                                            {/* Legacy fallback */}
                                            {!msg.payload && msg.content && <div>{msg.content}</div>}
                                        </div>
                                    )}

                                    <div className={cn("text-[10px] mt-1 opacity-70 text-right")} suppressHydrationWarning>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </CardContent>

            {attachment && (
                <div className="p-2 border-t bg-muted/30 flex items-center gap-2 text-sm">
                    <div className="flex-1 truncate flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        {attachment.name} ({(attachment.size / 1024 / 1024).toFixed(2)}MB)
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                        setAttachment(null)
                        if (fileInputRef.current) fileInputRef.current.value = ""
                    }}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
            <div className="p-4 border-t bg-background">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                setAttachment(e.target.files[0])
                            }
                        }} 
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isSending}>
                        <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        disabled={isSending}
                        autoComplete="off"
                    />
                    <Button type="submit" size="icon" disabled={isSending || (!newMessage.trim() && !attachment)}>
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </div>
        </Card>
    )
}

function MediaItem({ mediaUrl, mimeType, fileName }: { mediaUrl: string, mimeType: string, fileName: string }) {
    if (mimeType.startsWith('image/')) {
        return <img src={mediaUrl} alt={fileName} className="max-w-[250px] max-h-[300px] object-cover rounded-md" />
    }
    if (mimeType.startsWith('video/')) {
        return <video src={mediaUrl} controls className="max-w-[250px] max-h-[300px] rounded-md" />
    }
    if (mimeType.startsWith('audio/')) {
        return <audio src={mediaUrl} controls className="max-w-[250px]" />
    }
    return (
        <a href={mediaUrl} download={fileName} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-muted/50 border rounded-md text-sm hover:bg-muted transition-colors">
            <File className="h-4 w-4 flex-shrink-0" />
            <span className="truncate max-w-[200px]">{fileName}</span>
        </a>
    )
}

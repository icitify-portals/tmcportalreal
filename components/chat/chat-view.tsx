"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Send, ArrowLeft, Lock, Paperclip, X, File, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
// E2EE Imports
import { CryptoSetupDialog } from "./crypto-setup-dialog"
import { PinResetDialog } from "./pin-reset-dialog"
import * as cryptoLib from "@/lib/crypto"
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

    // Crypto State
    const [isKeysSetup, setIsKeysSetup] = useState<boolean | null>(null) // null = checking
    const [showSetup, setShowSetup] = useState(false)
    const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null)
    const [unlockPin, setUnlockPin] = useState("")
    const [isUnlocking, setIsUnlocking] = useState(false)
    const [userKeys, setUserKeys] = useState<any>(null)
    const [showReset, setShowReset] = useState(false)

    // Check if user has keys set up
    useEffect(() => {
        const checkKeys = async () => {
            try {
                const res = await fetch("/api/auth/keys")
                if (res.ok) {
                    const data = await res.json()
                    setUserKeys(data)
                    setIsKeysSetup(true)
                } else if (res.status === 404) {
                    setIsKeysSetup(false)
                    setShowSetup(true)
                }
            } catch (e) {
                console.error("Failed to check keys", e)
            }
        }
        checkKeys()
    }, [])

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/chats/${chatId}/messages`)
            if (res.ok) {
                const data = await res.json()
                // Decrypt messages if we have the private key
                const rawMessages = data.messages
                setParticipants(data.participants)

                if (privateKey) {
                    const decrypted = await Promise.all(rawMessages.map(async (msg: any) => {
                        if (msg.type === 'E2AE' && msg.encryptedKeys && msg.encryptedKeys[currentUserId]) {
                            try {
                                // 1. Decrypt Message Key
                                const msgKey = await cryptoLib.decryptMessageKey(msg.encryptedKeys[currentUserId], privateKey)
                                // 2. Decrypt Content
                                const contentStr = await cryptoLib.decryptMessageContent(msg.content, msgKey)
                                let payload;
                                try {
                                    payload = JSON.parse(contentStr)
                                } catch(e) {
                                    payload = { text: contentStr }
                                }
                                return { ...msg, payload, isDecrypted: true, msgKey }
                            } catch (e) {
                                return { ...msg, payload: { text: "⚠️ Decryption Failed" }, isDecrypted: false }
                            }
                        }
                        return msg
                    }))
                    setMessages(decrypted)
                } else {
                    setMessages(rawMessages)
                }
            }
        } catch (error) {
            console.error("Error fetching messages", error)
        } finally {
            setLoadingMessages(false)
        }
    }

    // Effect to update messages when private key becomes available
    useEffect(() => {
        setLoadingMessages(true)
        fetchMessages()
        const interval = setInterval(fetchMessages, 5000)
        return () => clearInterval(interval)
    }, [chatId, privateKey])


    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!unlockPin || !userKeys) return

        setIsUnlocking(true)
        try {
            const salt = userKeys.salt
            const pinKey = await cryptoLib.deriveKeyFromText(unlockPin, salt)
            const pkBase64 = await cryptoLib.decryptPrivateKey(userKeys.encryptedPrivateKey, pinKey)
            const pk = await cryptoLib.importPrivateKey(pkBase64)
            setPrivateKey(pk)
            setUnlockPin("")
        } catch (e) {
            console.error(e)
            toast.error("Incorrect PIN")
        } finally {
            setIsUnlocking(false)
        }
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() && !attachment) return

        if (!privateKey) {
            if (!isKeysSetup) {
                setShowSetup(true)
                toast.error("Please set up your secure keys to start chatting")
            } else {
                toast.error("Please unlock your secure keys first")
            }
            return
        }

        setIsSending(true)
        try {
            // E2EE Logic
            // 1. Generate Session Key
            const messageKey = await cryptoLib.generateMessageKey()

            let finalMediaUrl = ""
            if (attachment) {
                const encryptedBlob = await cryptoLib.encryptFileBlob(attachment, messageKey)
                const formData = new FormData()
                formData.append("file", encryptedBlob, attachment.name)
                formData.append("category", "chat-media")
                
                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData
                })
                if (uploadRes.ok) {
                    const data = await uploadRes.json()
                    finalMediaUrl = data.url
                } else {
                    throw new Error("Failed to upload encrypted file")
                }
            }

            // 2. Encrypt Content
            const payloadObj = {
                text: newMessage,
                mediaUrl: finalMediaUrl,
                mimeType: attachment?.type || "",
                fileName: attachment?.name || ""
            }
            const encryptedContent = await cryptoLib.encryptMessageContent(JSON.stringify(payloadObj), messageKey)

            // 3. Encrypt Session Key for Each Participant
            const encryptedKeys: Record<string, string> = {}

            // Ensure we have current user in participants to be able to read own message
            // The API returns all participants, but let's double check
            const targets = [...participants]
            if (!targets.find(p => p.id === currentUserId)) {
                // If for some reason curr user not in list (shouldn't happen), add self?
                // Actually API `chatParticipants` includes self.
            }

            for (const p of targets) {
                if (p.publicKey) {
                    encryptedKeys[p.id] = await cryptoLib.encryptMessageKeyForRecipient(messageKey, p.publicKey)
                }
            }

            if (Object.keys(encryptedKeys).length === 0) {
                // Fallback if no public keys found? Or just alert.
                // Ideally everyone should have keys.
            }

            const res = await fetch(`/api/chats/${chatId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: encryptedContent,
                    type: "E2AE",
                    encryptedKeys
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
            toast.error("Failed to send encrypted message")
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

    // -- RENDER STATES --

    // 1. Loading
    if (isKeysSetup === null) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>

    // 2. Unlock Screen (if keys exist but locked)
    if (isKeysSetup && !privateKey) {
        return (
            <Card className="h-full flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 border-0">
                <div className="max-w-xs w-full space-y-4 text-center">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                        <Lock className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold">Enter Chat PIN</h3>
                    <p className="text-sm text-muted-foreground">Your messages are end-to-end encrypted.</p>

                    <form onSubmit={handleUnlock} className="space-y-4">
                        <Input
                            type="password"
                            placeholder="Enter PIN"
                            className="text-center tracking-widest"
                            value={unlockPin}
                            onChange={e => setUnlockPin(e.target.value)}
                        />
                        <Button type="submit" className="w-full" disabled={isUnlocking}>
                            {isUnlocking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Unlock Messages"}
                        </Button>
                    </form>
                    <div className="text-xs text-muted-foreground mt-4">
                        Forgot PIN? <button onClick={() => setShowReset(true)} className="underline hover:text-primary">Reset with Recovery Key</button>
                    </div>
                </div>

                <PinResetDialog
                    open={showReset}
                    onOpenChange={setShowReset}
                    userKeys={userKeys}
                    onSuccess={() => window.location.reload()}
                />
            </Card>
        )
    }

    // 3. Main Chat View (Unlocked or Waiting for Setup)
    return (
        <Card className="h-full flex flex-col border-0 md:border">
            <CryptoSetupDialog
                open={showSetup}
                onOpenChange={setShowSetup}
                onSuccess={(pk) => {
                    setPrivateKey(pk)
                    setIsKeysSetup(true)
                }}
            />

            <CardHeader className="flex flex-row items-center gap-2 py-3 border-b">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <CardTitle className="text-base flex items-center gap-2">
                        {getChatName()}
                        <Lock className="h-3 w-3 text-green-500" />
                    </CardTitle>
                </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50 dark:bg-slate-900/20">
                {loadingMessages ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground mt-10">
                        {isKeysSetup ? "No messages yet. Start a secure conversation!" : "Finish setup to start chatting."}
                    </div>
                ) : (
                    messages.map((msg: any) => {
                        const isMe = msg.senderId === currentUserId
                        const isEncrypted = msg.type === 'E2AE'

                        return (
                            <div key={msg.id} className={cn("flex max-w-[80%]", isMe ? "ml-auto flex-row-reverse" : "mr-auto")}>
                                <div className={cn(
                                    "p-3 rounded-lg text-sm",
                                    isMe ? "bg-primary text-primary-foreground rounded-br-none" : "bg-white dark:bg-muted border rounded-bl-none"
                                )}>
                                    {!isMe && <div className="text-xs font-bold mb-1 opacity-70">{msg.sender.name}</div>}

                                    {isEncrypted && !msg.isDecrypted ? (
                                        <div className="flex items-center gap-1 text-xs opacity-70 italic">
                                            <Lock className="h-3 w-3" /> Encrypted message
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            {msg.payload?.mediaUrl && msg.msgKey && (
                                                <EncryptedMediaItem 
                                                    mediaUrl={msg.payload.mediaUrl}
                                                    mimeType={msg.payload.mimeType}
                                                    fileName={msg.payload.fileName}
                                                    msgKey={msg.msgKey}
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
                        placeholder="Type a secure message..."
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

function EncryptedMediaItem({ mediaUrl, mimeType, fileName, msgKey }: { mediaUrl: string, mimeType: string, fileName: string, msgKey: CryptoKey }) {
    const [mediaSrc, setMediaSrc] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch(mediaUrl)
                if (!res.ok) throw new Error("Failed to fetch media blob")
                const encryptedBlob = await res.blob()
                const decryptedBlob = await cryptoLib.decryptFileBlob(encryptedBlob, msgKey)
                // We recreate the blob with the correct mime type
                const typedBlob = new Blob([decryptedBlob], { type: mimeType })
                const url = URL.createObjectURL(typedBlob)
                setMediaSrc(url)
            } catch (e) {
                console.error("Failed to decrypt media", e)
            } finally {
                setLoading(false)
            }
        }
        load()
        return () => {
            if (mediaSrc) URL.revokeObjectURL(mediaSrc)
        }
    }, [mediaUrl, msgKey])

    if (loading) return <div className="h-32 w-32 flex items-center justify-center bg-muted animate-pulse rounded-md"><Loader2 className="animate-spin h-6 w-6" /></div>
    if (!mediaSrc) return <div className="text-xs text-red-500">Failed to load media</div>

    if (mimeType.startsWith('image/')) {
        return <img src={mediaSrc} alt={fileName} className="max-w-[250px] max-h-[300px] object-cover rounded-md" />
    }
    if (mimeType.startsWith('video/')) {
        return <video src={mediaSrc} controls className="max-w-[250px] max-h-[300px] rounded-md" />
    }
    if (mimeType.startsWith('audio/')) {
        return <audio src={mediaSrc} controls className="max-w-[250px]" />
    }
    return (
        <a href={mediaSrc} download={fileName} className="flex items-center gap-2 p-2 bg-muted/50 border rounded-md text-sm hover:bg-muted transition-colors">
            <File className="h-4 w-4 flex-shrink-0" />
            <span className="truncate max-w-[200px]">{fileName}</span>
        </a>
    )
}

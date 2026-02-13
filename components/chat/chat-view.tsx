"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Send, ArrowLeft, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
// E2EE Imports
import { CryptoSetupDialog } from "./crypto-setup-dialog"
import { PinResetDialog } from "./pin-reset-dialog"
import * as cryptoLib from "@/lib/crypto"
import { toast } from "sonner"

export function ChatView({ chatId, onBack, currentUserId }: any) {
    const [messages, setMessages] = useState<any[]>([])
    const [participants, setParticipants] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [loadingMessages, setLoadingMessages] = useState(true)

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
                                const content = await cryptoLib.decryptMessageContent(msg.content, msgKey)
                                return { ...msg, content: content, isDecrypted: true }
                            } catch (e) {
                                return { ...msg, content: "⚠️ Decryption Failed", isDecrypted: false }
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
        if (!newMessage.trim()) return

        if (!privateKey) {
            toast.error("Please unlock your secure keys first")
            return
        }

        setIsSending(true)
        try {
            // E2EE Logic
            // 1. Generate Session Key
            const messageKey = await cryptoLib.generateMessageKey()

            // 2. Encrypt Content
            const encryptedContent = await cryptoLib.encryptMessageContent(newMessage, messageKey)

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
                fetchMessages()
            }
        } catch (error) {
            console.error("Failed to send", error)
            toast.error("Failed to send encrypted message")
        } finally {
            setIsSending(false)
        }
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
                        Chat
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
                                        msg.content
                                    )}

                                    <div className={cn("text-[10px] mt-1 opacity-70 text-right")} suppressHydrationWarning>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </CardContent>

            <div className="p-4 border-t bg-background">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type a secure message..."
                        disabled={isSending}
                        autoComplete="off"
                    />
                    <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </div>
        </Card>
    )
}

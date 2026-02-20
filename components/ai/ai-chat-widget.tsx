"use client"

import { useRef, useEffect, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Send, User as UserIcon, Loader2, Minimize2, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { getAISettings } from "@/lib/actions/settings"

export function AiChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [isEnabled, setIsEnabled] = useState(false)
    const [isConfigLoaded, setIsConfigLoaded] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [inputValue, setInputValue] = useState("")

    useEffect(() => {
        setMounted(true)
        getAISettings().then(config => {
            setIsEnabled(config.enabled)
            setIsConfigLoaded(true)
        }).catch(() => {
            setIsEnabled(true)
            setIsConfigLoaded(true)
        })
    }, [])

    const scrollAnchorRef = useRef<HTMLDivElement>(null)

    const {
        messages,
        sendMessage,
        status,
        error,
    } = useChat({
        transport: new DefaultChatTransport({ api: "/api/chat" }),
        onError: (e: Error) => {
            console.error("Chat error:", e)
        }
    })

    const isLoading = status === "streaming" || status === "submitted"

    // Auto-scroll to latest message
    useEffect(() => {
        if (scrollAnchorRef.current) {
            scrollAnchorRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages, isLoading])

    // Prevent hydration mismatch
    if (!mounted || !isConfigLoaded || !isEnabled) return null

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90 transition-all hover:scale-110"
                size="icon"
            >
                <MessageCircle className="h-8 w-8 text-white" />
            </Button>
        )
    }

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault()
        const trimmed = inputValue.trim()
        if (!trimmed || isLoading) return

        setInputValue("")

        try {
            await sendMessage({ text: trimmed })
        } catch (err) {
            console.error("Send failed:", err)
            setInputValue(trimmed)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    // Extract text from UIMessage parts
    const getMessageText = (parts: any[]): string => {
        if (!parts || !Array.isArray(parts)) return ""
        return parts
            .filter((p: any) => p.type === "text")
            .map((p: any) => p.text)
            .join("")
    }

    return (
        <Card className="fixed bottom-4 right-4 w-[380px] h-[600px] shadow-xl z-50 flex flex-col animate-in slide-in-from-bottom-5 fade-in">
            {/* Header */}
            <CardHeader className="p-4 border-b bg-primary text-primary-foreground rounded-t-xl flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                    <Bot className="h-6 w-6" />
                    <div>
                        <CardTitle className="text-base">TMC Assistant</CardTitle>
                        <span className="text-[10px] opacity-90">Powered by AI</span>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-white/20 text-white"
                    onClick={() => setIsOpen(false)}
                >
                    <Minimize2 className="h-4 w-4" />
                </Button>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 p-0 overflow-hidden relative bg-muted/30">
                <ScrollArea className="h-full p-4">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground text-sm text-center px-6">
                            <Bot className="h-12 w-12 mb-4 opacity-20" />
                            <p>Salam! I am your AI assistant.</p>
                            <p className="mt-2 text-xs">Ask me about your dashboard, upcoming programmes, or how to pay your dues.</p>
                        </div>
                    )}

                    <div className="flex flex-col gap-4 pb-2">
                        {messages.map((m) => {
                            const text = getMessageText(m.parts as any[])
                            if (!text) return null
                            return (
                                <div
                                    key={m.id}
                                    className={cn(
                                        "flex gap-3 max-w-[85%]",
                                        m.role === "user" ? "self-end flex-row-reverse" : "self-start"
                                    )}
                                >
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                        m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted border"
                                    )}>
                                        {m.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                    </div>
                                    <div className={cn(
                                        "rounded-2xl px-4 py-2 text-sm shadow-sm",
                                        m.role === "user"
                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                            : "bg-background border rounded-tl-none"
                                    )}>
                                        <p className="whitespace-pre-wrap">{text}</p>
                                    </div>
                                </div>
                            )
                        })}

                        {/* Loading dots animation */}
                        {isLoading && (
                            <div className="flex gap-3 max-w-[85%] self-start">
                                <div className="h-8 w-8 rounded-full bg-muted border flex items-center justify-center shrink-0">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="bg-background border rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center">
                                    <span className="flex gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce"></span>
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Error banner */}
                        {error && (
                            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-xs text-center">
                                {error.message || "Something went wrong. Please try again."}
                            </div>
                        )}

                        {/* Scroll anchor */}
                        <div ref={scrollAnchorRef} />
                    </div>
                </ScrollArea>
            </CardContent>

            {/* Footer Input */}
            <CardFooter className="p-3 border-t bg-background">
                <form onSubmit={handleSend} className="flex w-full gap-2 items-center">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="flex-1 focus-visible:ring-1"
                        autoFocus
                        disabled={isLoading}
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </CardFooter>
        </Card>
    )
}

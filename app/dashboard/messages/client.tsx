"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChatList } from "@/components/chat/chat-list"
import { ChatView } from "@/components/chat/chat-view"

type Chat = {
    id: string
    name: string | null
    isGroup: boolean
    lastMessage: {
        content: string
        senderName: string
        createdAt: string
    } | null
    updatedAt: string
    participants: {
        id: string
        name: string
        image: string | null
    }[]
}

export default function MessagesClientPage() {
    const { data: session } = useSession()
    const [chats, setChats] = useState<Chat[]>([])
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const fetchChats = async () => {
        try {
            const res = await fetch("/api/chats")
            if (res.ok) {
                const data = await res.json()
                setChats(data)
            }
        } catch (error) {
            console.error("Failed to load chats", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchChats()
        // Poll for updates every 10s
        const interval = setInterval(fetchChats, 10000)
        return () => clearInterval(interval)
    }, [])

    // Callback when a new chat is created
    const handleChatCreated = (newChatId: string) => {
        fetchChats()
        setSelectedChatId(newChatId)
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-4">
            {/* Sidebar: Chat List */}
            <div className={cn("w-full md:w-1/3 flex flex-col gap-4", selectedChatId ? "hidden md:flex" : "flex")}>
                <Card className="h-full flex flex-col">
                    <ChatList
                        chats={chats}
                        isLoading={isLoading}
                        selectedChatId={selectedChatId}
                        onSelectChat={setSelectedChatId}
                        onChatCreated={handleChatCreated}
                        currentUserId={session?.user?.id}
                    />
                </Card>
            </div>

            {/* Main: Chat View */}
            <div className={cn("w-full md:w-2/3 flex flex-col", !selectedChatId ? "hidden md:flex" : "flex")}>
                {selectedChatId ? (
                    <ChatView
                        chatId={selectedChatId}
                        onBack={() => setSelectedChatId(null)}
                        currentUserId={session?.user?.id}
                    />
                ) : (
                    <Card className="h-full flex items-center justify-center p-6 text-center text-muted-foreground bg-muted/50 border-dashed">
                        <div>
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-medium">Select a conversation</h3>
                            <p>Choose a chat from the sidebar or start a new one.</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Plus, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

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

export function ChatList({ chats, isLoading, selectedChatId, onSelectChat, onChatCreated, currentUserId }: any) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [foundUsers, setFoundUsers] = useState<any[]>([])
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
    const [groupName, setGroupName] = useState("")
    const [isCreating, setIsCreating] = useState(false)

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
                if (res.ok) {
                    setFoundUsers(await res.json())
                }
            } else {
                setFoundUsers([])
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const handleCreateChat = async () => {
        if (selectedUserIds.length === 0) return

        const isGroup = selectedUserIds.length > 1
        if (isGroup && !groupName.trim()) {
            return // Show error: Group name required
        }

        setIsCreating(true)
        try {
            const res = await fetch("/api/chats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    participantIds: selectedUserIds,
                    isGroup,
                    name: groupName
                })
            })

            if (res.ok) {
                const data = await res.json()
                onChatCreated(data.id)
                setIsDialogOpen(false)
                // Reset form
                setSelectedUserIds([])
                setGroupName("")
                setSearchQuery("")
            } else {
                const err = await res.json()
                alert(err.error || "Failed to create chat")
            }
        } catch (error) {
            console.error("Failed to create chat", error)
        } finally {
            setIsCreating(false)
        }
    }

    const toggleUser = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const getChatName = (chat: Chat) => {
        if (chat.isGroup) return chat.name || "Group"
        const other = chat.participants.find(p => p.id !== currentUserId)
        return other?.name || "Unknown User"
    }

    const getChatImage = (chat: Chat) => {
        if (chat.isGroup) return null
        const other = chat.participants.find(p => p.id !== currentUserId)
        return other?.image
    }

    return (
        <>
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                <div>
                    <CardTitle>Messages</CardTitle>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="icon" variant="ghost">
                            <Plus className="h-5 w-5" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>New Chat</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            {/* Search Users */}
                            <div className="space-y-2">
                                <Input
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {foundUsers.length > 0 && (
                                    <div className="border rounded-md max-h-40 overflow-y-auto p-2 space-y-1">
                                        {foundUsers.map(user => (
                                            <div
                                                key={user.id}
                                                className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                                                onClick={() => toggleUser(user.id)}
                                            >
                                                <Checkbox checked={selectedUserIds.includes(user.id)} />
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={user.image} />
                                                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm">{user.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Group Name (if > 1 user selected) */}
                            {selectedUserIds.length > 1 && (
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Group Name"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        You are creating a group with {selectedUserIds.length} members.
                                    </p>
                                </div>
                            )}

                            {/* Selected Summary */}
                            {selectedUserIds.length === 1 && (
                                <p className="text-xs text-muted-foreground">
                                    Starting chat with 1 user.
                                </p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateChat} disabled={isCreating || selectedUserIds.length === 0}>
                                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {selectedUserIds.length > 1 ? "Create Group" : "Start Chat"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="flex flex-col gap-1 p-2">
                        {isLoading && <div className="p-4 text-center text-sm">Loading chats...</div>}
                        {!isLoading && chats.length === 0 && (
                            <div className="p-4 text-center text-sm text-muted-foreground">No conversations yet.</div>
                        )}
                        {chats.map((chat: Chat) => (
                            <button
                                key={chat.id}
                                onClick={() => onSelectChat(chat.id)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover:bg-muted/50",
                                    selectedChatId === chat.id && "bg-muted"
                                )}
                            >
                                <Avatar>
                                    <AvatarImage src={getChatImage(chat) || undefined} />
                                    <AvatarFallback>{getChatName(chat)[0] || "?"}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium truncate">{getChatName(chat)}</span>
                                        {chat.lastMessage && (
                                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2" suppressHydrationWarning>
                                                {formatDistanceToNow(new Date(chat.lastMessage.createdAt), { addSuffix: false })}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {chat.lastMessage ? (
                                            <>
                                                <span className="font-semibold">{chat.lastMessage.senderName}: </span>
                                                {chat.lastMessage.content}
                                            </>
                                        ) : "No messages"}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </>
    )
}

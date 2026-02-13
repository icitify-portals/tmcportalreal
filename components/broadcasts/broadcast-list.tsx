"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Image as ImageIcon, Music, Trash2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteBroadcast } from "@/lib/actions/broadcasts"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { ClientDate } from "@/components/ui/client-date"

export function BroadcastList({ broadcasts, currentUserId }: { broadcasts: any[], currentUserId?: string }) {
    const router = useRouter()

    if (broadcasts.length === 0) {
        return (
            <div className="text-center py-16 border rounded-xl bg-muted/5 border-dashed">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No broadcasts yet</h3>
                <p className="text-sm text-muted-foreground">Important announcements and updates will appear here.</p>
            </div>
        )
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this broadcast?")) return
        const res = await deleteBroadcast(id)
        if (res.success) {
            toast.success("Broadcast deleted")
            router.refresh()
        } else {
            toast.error(res.error)
        }
    }

    return (
        <div className="space-y-6">
            {broadcasts.map((broadcast) => (
                <Card key={broadcast.id} className="overflow-hidden border-l-4 border-l-green-600 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center gap-4 py-4 bg-muted/5">
                        <Avatar className="h-10 w-10 border-2 border-green-100">
                            <AvatarImage src={broadcast.sender.image} />
                            <AvatarFallback className="bg-green-600 text-white font-bold">{broadcast.sender.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="font-bold text-lg truncate leading-none">{broadcast.title}</h3>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Badge variant="outline" className="text-[10px] h-5 bg-green-50 text-green-700 border-green-200">
                                        {broadcast.targetLevel.replace("_", " ")}
                                    </Badge>
                                    {broadcast.senderId === currentUserId && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDelete(broadcast.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                                <span className="font-semibold text-foreground">{broadcast.sender.name}</span>
                                <span className="opacity-30">•</span>
                                <ClientDate date={broadcast.createdAt} mode="relative" />
                                {broadcast.targetOrganization && (
                                    <>
                                        <span className="opacity-30">•</span>
                                        <span className="italic">{broadcast.targetOrganization.name}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="py-5">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{broadcast.content}</p>

                        {broadcast.media && broadcast.media.length > 0 && (
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {broadcast.media.map((item: any, idx: number) => (
                                    <div key={idx} className="rounded-xl overflow-hidden border shadow-sm bg-muted/20">
                                        {item.type === 'image' && (
                                            <div className="aspect-video relative group cursor-pointer" onClick={() => window.open(item.url, '_blank')}>
                                                <img src={item.url} alt="Broadcast Attachment" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <ImageIcon className="text-white h-8 w-8" />
                                                </div>
                                            </div>
                                        )}
                                        {item.type === 'audio' && (
                                            <div className="p-4 flex flex-col items-center gap-3">
                                                <div className="bg-green-100 p-3 rounded-full">
                                                    <Music className="h-6 w-6 text-green-700" />
                                                </div>
                                                <audio controls className="w-full h-10">
                                                    <source src={item.url} />
                                                    Your browser does not support the audio element.
                                                </audio>
                                            </div>
                                        )}
                                        {item.type === 'video' && (
                                            <div className="relative aspect-video bg-black">
                                                <video controls className="w-full h-full object-contain">
                                                    <source src={item.url} />
                                                    Your browser does not support the video element.
                                                </video>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

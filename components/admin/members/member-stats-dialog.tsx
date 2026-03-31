"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger,
} from "@/components/ui/dialog"
import { BarChart3, Loader2, Users } from "lucide-react"
import { getMemberStats } from "@/lib/actions/members"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

export function MemberStatsDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [stats, setStats] = useState<{ total: number, breakdown: any[] } | null>(null)

    async function handleOpen() {
        setOpen(true)
        setLoading(true)
        try {
            const res = await getMemberStats()
            if (res.success) {
                setStats({ total: res.total || 0, breakdown: res.breakdown || [] })
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" onClick={handleOpen}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Member Statistics
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl sm:max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Membership Overview
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p>Aggregating membership data...</p>
                    </div>
                ) : stats ? (
                    <div className="space-y-6 overflow-hidden">
                        <div className="grid grid-cols-1 gap-4">
                            <Card className="bg-primary/5 border-primary/20">
                                <CardContent className="p-6 flex flex-col items-center justify-center">
                                    <div className="text-4xl font-bold text-primary">{stats.total}</div>
                                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Members</div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">State Breakdown</h3>
                            <ScrollArea className="h-[300px] border rounded-md p-4">
                                <div className="space-y-4">
                                    {stats.breakdown.length > 0 ? stats.breakdown.map((item, idx) => {
                                        const percentage = stats.total > 0 ? (item.count / stats.total) * 100 : 0
                                        return (
                                            <div key={idx} className="space-y-1">
                                                <div className="flex items-center justify-between text-sm font-medium">
                                                    <span>{item.state}</span>
                                                    <span className="text-muted-foreground">{item.count} members</span>
                                                </div>
                                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-primary transition-all duration-500 ease-out" 
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    }) : (
                                        <p className="text-center text-muted-foreground py-4 italic">No state data available.</p>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}

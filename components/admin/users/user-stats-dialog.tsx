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
import { BarChart3, Loader2, Users, UserMinus, UserCheck } from "lucide-react"
import { getUserStats } from "@/lib/actions/members"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export function UserStatsDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [stats, setStats] = useState<{ total: number, notMembers: number, totalMembers: number } | null>(null)

    async function handleOpen() {
        setOpen(true)
        setLoading(true)
        try {
            const res = await getUserStats()
            if (res.success) {
                setStats({ 
                    total: res.total || 0, 
                    notMembers: res.notMembers || 0,
                    totalMembers: res.totalMembers || 0
                })
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
                    User Statistics
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-emerald-600" />
                        User Overview
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                        <p>Loading user statistics...</p>
                    </div>
                ) : stats ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Link href="/dashboard/admin/users" onClick={() => setOpen(false)} className="block">
                                <Card className="bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50 transition-colors cursor-pointer">
                                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                        <Users className="h-6 w-6 text-emerald-600 mb-2" />
                                        <div className="text-3xl font-bold text-emerald-700">{stats.total}</div>
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Users</div>
                                    </CardContent>
                                </Card>
                            </Link>

                            <Link href="/dashboard/admin/users?filter=non-members" onClick={() => setOpen(false)} className="block">
                                <Card className="bg-amber-50/50 border-amber-100 hover:bg-amber-50 transition-colors cursor-pointer">
                                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                        <UserMinus className="h-6 w-6 text-amber-600 mb-2" />
                                        <div className="text-3xl font-bold text-amber-700">{stats.notMembers}</div>
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Registered but Not Members</div>
                                    </CardContent>
                                </Card>
                            </Link>

                            <Link href="/dashboard/admin/members" onClick={() => setOpen(false)} className="block">
                                <Card className="bg-blue-50/50 border-blue-100 hover:bg-blue-50 transition-colors cursor-pointer">
                                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                        <UserCheck className="h-6 w-6 text-blue-600 mb-2" />
                                        <div className="text-3xl font-bold text-blue-700">{stats.totalMembers}</div>
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Members</div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}

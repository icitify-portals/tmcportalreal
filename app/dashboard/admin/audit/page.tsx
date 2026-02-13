export const dynamic = 'force-dynamic'

import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { auditLogs, users } from "@/lib/db/schema"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { desc, eq, inArray } from "drizzle-orm"
import { Badge } from "@/components/ui/badge"
import { Shield, Clock, User, Activity } from "lucide-react"


export default async function AuditLogsPage() {
    const session = await getServerSession()

    // Auth check - should be limited to SuperAdmins or specialized roles
    const isAdmin = session?.user?.roles?.some((r: any) =>
        r.jurisdictionLevel === "SYSTEM" || r.code === "SUPER_ADMIN"
    )

    if (!isAdmin) {
        return (
            <DashboardLayout>
                <div className="p-6 text-center text-red-500 font-bold">
                    Access Denied: Administratve privileges required.
                </div>
            </DashboardLayout>
        )
    }

    // Fetch logs
    const rawLogs = await db.query.auditLogs.findMany({
        orderBy: [desc(auditLogs.createdAt)],
        limit: 100,
    })

    // Fetch users for the logs
    const userIds = [...new Set(rawLogs.map(l => l.userId).filter(Boolean))] as string[]
    const usersData = userIds.length > 0 ? await db.query.users.findMany({
        where: (u, { inArray }) => inArray(u.id, userIds),
        columns: { id: true, name: true, email: true }
    }) : []

    const logs = rawLogs.map(log => ({
        ...log,
        user: usersData.find(u => u.id === log.userId) || { name: "System", email: "N/A" }
    }))

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Shield className="h-8 w-8 text-primary" />
                            Audit Logs
                        </h1>
                        <p className="text-muted-foreground">Detailed record of system activities and changes</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>View the last 100 administrative actions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="p-3 font-medium">Timestamp</th>
                                        <th className="p-3 font-medium">User</th>
                                        <th className="p-3 font-medium">Action</th>
                                        <th className="p-3 font-medium">Entity</th>
                                        <th className="p-3 font-medium">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="p-3 whitespace-nowrap text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(log.createdAt!).toLocaleString('en-GB')}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{log.user.name}</span>
                                                    <span className="text-xs text-muted-foreground">{log.user.email}</span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                                                    {log.action}
                                                </Badge>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold text-primary/80 uppercase tracking-tight">
                                                        {log.entityType}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">
                                                        {log.entityId || "N/A"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3 max-w-xs xl:max-w-md truncate">
                                                {log.description}
                                            </td>
                                        </tr>
                                    ))}
                                    {logs.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                                No audit logs found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}

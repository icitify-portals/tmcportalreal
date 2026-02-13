export const dynamic = 'force-dynamic'

import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { officials, users, organizations } from "@/lib/db/schema"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, UserCheck, Mail, Phone, Building2 } from "lucide-react"
import Link from "next/link"
import { desc, eq, inArray } from "drizzle-orm"
import { format } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


export default async function OfficialsPage() {
    const session = await getServerSession()

    // Fetch officials with basic user and org data
    const rawOfficials = await db.query.officials.findMany({
        orderBy: [desc(officials.createdAt)],
    })

    // Manual join to avoid LATERAL issues
    const userIds = [...new Set(rawOfficials.map(o => o.userId).filter(Boolean))] as string[]
    const orgIds = [...new Set(rawOfficials.map(o => o.organizationId).filter(Boolean))] as string[]

    const usersData = userIds.length > 0 ? await db.query.users.findMany({
        where: (u, { inArray }) => inArray(u.id, userIds),
        columns: { id: true, name: true, email: true, phone: true, image: true }
    }) : []

    const orgsData = orgIds.length > 0 ? await db.query.organizations.findMany({
        where: (o, { inArray }) => inArray(o.id, orgIds),
        columns: { id: true, name: true, level: true }
    }) : []

    const officialsList = rawOfficials.map(official => ({
        ...official,
        user: usersData.find(u => u.id === official.userId) || { name: 'Unknown', email: '', phone: '' },
        organization: orgsData.find(o => o.id === official.organizationId) || { name: 'Unknown', level: '' }
    }))

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <UserCheck className="h-8 w-8 text-primary" />
                            Officials
                        </h1>
                        <p className="text-muted-foreground">Manage organization officials and their terms</p>
                    </div>
                    <Link href="/dashboard/admin/officials/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Official
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {officialsList.map((official) => (
                        <Card key={official.id} className="overflow-hidden">
                            <CardHeader className="bg-muted/30 pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-3">
                                        <Avatar className="h-10 w-10 border shadow-sm">
                                            <AvatarImage src={official.image || (official.user as any).image} />
                                            <AvatarFallback>{(official.user as any).name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-lg">{(official.user as any).name}</CardTitle>
                                            <CardDescription className="text-xs uppercase font-bold text-primary">
                                                {official.position}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant={official.isActive ? "default" : "secondary"}>
                                        {official.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span>{official.organization.name}</span>
                                    <Badge variant="outline" className="text-[10px] h-4">
                                        {official.positionLevel}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="truncate">{official.user.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{official.user.phone || "No phone"}</span>
                                </div>

                                <div className="pt-2 border-t flex justify-between items-center text-[10px] text-muted-foreground">
                                    <span>Term: {official.termStart ? format(new Date(official.termStart), 'PP') : 'N/A'} - {official.termEnd ? format(new Date(official.termEnd), 'PP') : 'Present'}</span>
                                    <Link href={`/dashboard/admin/officials/${official.id}`} className="text-primary hover:underline font-medium">
                                        View Details
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {officialsList.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground">
                            No officials found. Click "Add Official" to get started.
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}

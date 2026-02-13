export const dynamic = 'force-dynamic'

import { getServerSession } from "@/lib/session"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { db } from "@/lib/db"
import { organizations, officials, users } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { notFound } from "next/navigation"
import { Building2, Mail, Phone, MapPin, UserPlus, ArrowLeft, Globe, UserCheck, Calendar, Edit2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { PlanningSettingsForm } from "@/components/admin/organizations/planning-settings-form"


export default async function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await getServerSession()

    const orgData = await db.query.organizations.findFirst({
        where: eq(organizations.id, id),
    })

    if (!orgData) {
        return notFound()
    }

    // Manually fetch parent to avoid LATERAL JOIN in older MariaDB
    const parent = orgData.parentId ? await db.query.organizations.findFirst({
        where: eq(organizations.id, orgData.parentId)
    }) : null;

    // Attach parent back for existing UI logic
    const org = { ...orgData, parent };

    // Fetch officials for this organization
    const officialsRaw = await db.query.officials.findMany({
        where: eq(officials.organizationId, id),
        orderBy: [desc(officials.createdAt)],
    })

    // Manually fetch users to avoid LATERAL/Complex joins
    const orgOfficials = await Promise.all(officialsRaw.map(async (off) => {
        const user = off.userId ? await db.query.users.findFirst({
            where: eq(users.id, off.userId)
        }) : null;
        return { ...off, user };
    }));

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <Button variant="ghost" size="sm" asChild className="mb-4 pl-0">
                        <Link href="/dashboard/admin/organizations">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Organizations
                        </Link>
                    </Button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <Building2 className="h-8 w-8 text-primary" />
                                {org.name}
                            </h1>
                            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                                <Badge variant="outline">{org.level}</Badge>
                                {org.code && <Badge variant="secondary">{org.code}</Badge>}
                                {org.parent && (
                                    <span className="text-sm">
                                        Parent: <span className="font-medium text-foreground">{org.parent.name}</span>
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button asChild>
                                <Link href={`/dashboard/admin/organizations/${id}/edit`}>
                                    <Edit2 className="mr-2 h-4 w-4" /> Edit Organization
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Organization Details */}
                    <Card className="lg:col-span-1 h-fit">
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {org.email && (
                                <div className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{org.email}</span>
                                </div>
                            )}
                            {org.phone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{org.phone}</span>
                                </div>
                            )}
                            {org.address && (
                                <div className="flex items-center gap-3">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{org.address}{org.city ? `, ${org.city}` : ''}</span>
                                </div>
                            )}
                            {org.website && (
                                <div className="flex items-center gap-3">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                        Website
                                    </a>
                                </div>
                            )}
                            {!org.email && !org.phone && !org.address && !org.website && (
                                <p className="text-sm text-muted-foreground italic">No contact details provided.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-1 h-fit border-indigo-200 bg-indigo-50/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-indigo-600" />
                                Planning Deadline
                            </CardTitle>
                            <CardDescription>
                                Configure the deadline for program planning submissions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PlanningSettingsForm
                                orgId={org.id}
                                initialMonth={org.planningDeadlineMonth || 12}
                                initialDay={org.planningDeadlineDay || 12}
                            />
                        </CardContent>
                    </Card>

                    {/* Officials Management */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <UserCheck className="h-5 w-5" />
                                Officials & Administrators
                            </h2>
                            <Button size="sm" asChild>
                                <Link href={`/dashboard/admin/officials/new?organizationId=${org.id}`}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Assign Official
                                </Link>
                            </Button>
                        </div>

                        <div className="grid gap-4">
                            {orgOfficials.length > 0 ? (
                                orgOfficials.map(official => (
                                    <Card key={official.id}>
                                        <div className="flex items-center p-4 gap-4">
                                            <div className="h-10 w-10 min-w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {official.user?.name?.charAt(0) || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-base truncate">{official.user?.name || 'Unknown User'}</h3>
                                                <p className="text-sm text-primary font-medium">{official.position}</p>
                                                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3" /> {official.user?.email || 'No Email'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" /> Term: {official.termStart ? format(new Date(official.termStart), 'PP') : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/dashboard/admin/officials/${official.id}`}>
                                                    View
                                                </Link>
                                            </Button>
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center py-12 border rounded-lg bg-muted/10">
                                    <UserCheck className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
                                    <h3 className="text-lg font-medium text-muted-foreground">No officials assigned</h3>
                                    <p className="text-sm text-muted-foreground mb-4">Assign an admin or executive to this organization.</p>
                                    <Button variant="outline" asChild>
                                        <Link href={`/dashboard/admin/officials/new?organizationId=${org.id}`}>
                                            Assign Now
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

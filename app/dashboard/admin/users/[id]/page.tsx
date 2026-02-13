export const dynamic = 'force-dynamic'
import Link from "next/link"
import { notFound } from "next/navigation"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { users, roles, userRoles, organizations } from "@/lib/db/schema"
import { requirePermission } from "@/lib/rbac-v2"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { eq, and, asc } from "drizzle-orm"
import { ArrowLeft, Plus, ShieldAlert, Trash2 } from "lucide-react"
import { AssignRoleForm } from "./assign-role-form"
import { RemoveRoleButton } from "./remove-role-button"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function UserDetailPage(props: PageProps) {
    const { id } = await props.params
    const session = await getServerSession()
    // requirePermission(session, "users:read")

    // 1. Fetch User Basic Info
    const userResult = await db.select().from(users).where(eq(users.id, id)).limit(1);
    const userInfo = userResult[0];

    if (!userInfo) notFound();

    // 2. Fetch Assigned Roles with Relations
    const assignedRoles = await db.select({
        id: userRoles.id,
        role: roles,
        organization: organizations
    })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .leftJoin(organizations, eq(userRoles.organizationId, organizations.id))
        .where(and(
            eq(userRoles.userId, id),
            eq(userRoles.isActive, true)
        ));

    // 3. Construct user object compatible with page
    const user = {
        ...userInfo,
        userRoles: assignedRoles
    };

    if (!user) notFound()

    // Fetch available roles for assignment
    const availableRoles = await db.query.roles.findMany({
        where: eq(roles.isActive, true),
        orderBy: [asc(roles.name)]
    })

    // Fetch active organizations for jurisdiction selection
    const allOrganizations = await db.query.organizations.findMany({
        where: eq(organizations.isActive, true),
        columns: {
            id: true,
            name: true,
            level: true,
            parentId: true
        },
        orderBy: [asc(organizations.name)]
    })

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-5xl mx-auto">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin/users">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
                        <p className="text-muted-foreground">{user.email}</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* User Info & Stats */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Assigned Roles</CardTitle>
                            <CardDescription>
                                System roles granted to this user.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {user.userRoles.length === 0 ? (
                                <div className="text-sm text-muted-foreground py-4 border border-dashed rounded-md text-center">
                                    No roles assigned.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {user.userRoles.map((ur) => (
                                        <div key={ur.id} className="flex items-center justify-between p-3 border rounded-md">
                                            <div className="space-y-1">
                                                <div className="font-medium flex items-center gap-2">
                                                    <ShieldAlert className="h-4 w-4 text-primary" />
                                                    {ur.role.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground flex gap-2">
                                                    <Badge variant="outline" className="text-[10px]">{ur.role.jurisdictionLevel}</Badge>
                                                    {ur.organization && (
                                                        <span className="flex items-center gap-1">
                                                            at <b>{ur.organization.name}</b>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <RemoveRoleButton userRoleId={ur.id} userId={user.id} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Assign Role Panel */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Assign New Role</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AssignRoleForm
                                userId={user.id}
                                roles={availableRoles}
                                organizations={allOrganizations}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}

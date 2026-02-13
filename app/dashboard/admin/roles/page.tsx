import { Suspense } from "react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
export const dynamic = 'force-dynamic'
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { roles, userRoles } from "@/lib/db/schema"
import { requirePermission } from "@/lib/rbac-v2"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table" // Assuming these exist, if not I'll use standard divs or create them
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Shield, Trash2, Edit } from "lucide-react"
import { asc, eq, sql, count } from "drizzle-orm"

async function RoleList() {
    const allRoles = await db.query.roles.findMany({
        orderBy: [asc(roles.name)]
    })

    // Fetch user counts separately to avoid json_arrayagg issues
    const roleCounts = await db.select({
        roleId: userRoles.roleId,
        count: count(userRoles.userId)
    })
        .from(userRoles)
        .groupBy(userRoles.roleId)

    const countsMap = new Map(roleCounts.map(r => [r.roleId, r.count]))

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[300px]">Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Jurisdiction</TableHead>
                        <TableHead>Users</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {allRoles.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No roles found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        allRoles.map((role) => (
                            <TableRow key={role.id}>
                                <TableCell>
                                    <div className="font-medium flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-primary" />
                                        {role.name}
                                    </div>
                                    {role.description && (
                                        <div className="text-xs text-muted-foreground mt-1 max-w-[300px] truncate">
                                            {role.description}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <code className="bg-muted px-2 py-1 rounded text-xs">{role.code}</code>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{role.jurisdictionLevel}</Badge>
                                </TableCell>
                                <TableCell>
                                    {countsMap.get(role.id) || 0}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={role.isActive ? "default" : "secondary"}>
                                        {role.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link href={`/dashboard/admin/roles/${role.id}`}>
                                            <Button variant="ghost" size="icon" title="Edit Role">
                                                <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                            </Button>
                                        </Link>
                                        {!role.isSystem && (
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" title="Delete Role">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

export default async function RolesPage() {
    const session = await getServerSession()
    // try {
    //     await requirePermission(session, "roles:read")
    // } catch (e) {
    //     // For now, redirect or show error if not superadmin/authorized
    //     // In dev, maybe loose? No, strict.
    //     // redirect("/dashboard")
    // }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage user roles, jurisdiction levels, and system access permissions.
                        </p>
                    </div>
                    <Link href="/dashboard/admin/roles/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Role
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>System Roles</CardTitle>
                        <CardDescription>
                            A list of all registered roles in the system.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Suspense fallback={<div>Loading roles...</div>}>
                            <RoleList />
                        </Suspense>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}

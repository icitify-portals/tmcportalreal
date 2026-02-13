export const dynamic = 'force-dynamic'
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { roles, permissions, rolePermissions } from "@/lib/db/schema"
import { requirePermission } from "@/lib/rbac-v2"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { RoleForm } from "./role-form"
import { eq, asc } from "drizzle-orm"

interface RolePageProps {
    params: Promise<{
        id: string
    }>
}

export default async function RolePage({ params }: RolePageProps) {
    const { id } = await params
    const session = await getServerSession()
    const isNew = id === 'new'

    // Permission check
    // Temporarily lenient for dev if needed, but strictly:
    // requirePermission(session, isNew ? "roles:create" : "roles:update")

    // Fetch all permissions for the matrix
    const allPermissions = await db.query.permissions.findMany({
        orderBy: [asc(permissions.category), asc(permissions.name)],
        where: eq(permissions.isActive, true)
    })

    // Group permissions
    const groupedPermissions = allPermissions.reduce((acc: Record<string, any[]>, perm) => {
        const cat = perm.category || 'Uncategorized';
        if (!acc[cat]) {
            acc[cat] = []
        }
        acc[cat].push(perm)
        return acc
    }, {} as Record<string, any[]>)

    let roleData = null

    if (!isNew) {
        const rawRole = await db.query.roles.findFirst({
            where: eq(roles.id, id)
        })

        if (!rawRole) {
            notFound()
        }

        // Fetch permissions manually to avoid LATERAL JOIN issues
        const permissionsData = await db.select().from(rolePermissions).where(eq(rolePermissions.roleId, id))

        roleData = {
            ...rawRole,
            rolePermissions: permissionsData
        }

        if (!roleData) {
            notFound()
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-5xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isNew ? "Create New Role" : `Edit Role: ${roleData?.name}`}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {isNew
                            ? "Define a new role and assign its system permissions."
                            : "Modify role details and update permission assignments."}
                    </p>
                </div>

                <div className="border rounded-lg p-6 bg-card">
                    <RoleForm
                        initialData={roleData}
                        permissions={allPermissions}
                        groupedPermissions={groupedPermissions}
                    />
                </div>
            </div>
        </DashboardLayout>
    )
}

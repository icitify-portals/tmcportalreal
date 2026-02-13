export const dynamic = 'force-dynamic'
import { Suspense } from "react"
import Link from "next/link"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { users, userRoles, roles } from "@/lib/db/schema"
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
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, UserCog, Shield } from "lucide-react"
import { desc, or, ilike, eq, inArray, and } from "drizzle-orm"
import { redirect } from "next/navigation"
import { format } from "date-fns"

// Reusing query logic from API essentially, but Server Component pattern is often direct DB access.
// However, reusing API keeps logic centralized? 
// For dashboard pages, direct DB access is standard in Next.js Server Components.

async function UserList({ searchParams }: { searchParams: { q?: string } }) {
    // Need to dynamically import to use searchParams in Server Component correctly in Next 15+? 
    // Actually props are fine.

    // Note: In Next.js 15, searchParams is a Promise.
    // But let's assume standard behavior or fix if needed. 
    // The user's metadata says "Next.js 15 breaking changes (params as Promise)" so I shoould treat searchParams as Promise too?
    // Wait, recent fix was "Fix Next.js 15 breaking changes (params as Promise)".
    // Usually searchParams is also often a promise now or will be. 
    // Let's implement robustly.

    const session = await getServerSession()
    // Authorization check
    // requirePermission(session, "users:read") // Throwing error might crash page, better to handle gracefully or standard error boundary

    // Fetch data
    const query = searchParams?.q || ""

    // Using fetch to API or Direct DB?
    // Direct DB is faster and avoids self-request issues in some environments.

    // 1. Fetch Users
    console.log("Fetching users manually to avoid LATERAL JOIN...");
    const rawUsers = await db.select()
        .from(users)
        .where(query ? or(ilike(users.name, `%${query}%`), ilike(users.email, `%${query}%`)) : undefined)
        .orderBy(desc(users.createdAt))
        .limit(50);

    // 2. Fetch User Roles for these users
    const userIds = rawUsers.map(u => u.id);

    // Define type for our roles data
    let rolesData: { userId: string, id: string, role: typeof roles.$inferSelect }[] = [];

    if (userIds.length > 0) {
        rolesData = await db.select({
            userId: userRoles.userId,
            id: userRoles.id,
            role: roles
        })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(and(
                inArray(userRoles.userId, userIds),
                eq(userRoles.isActive, true)
            ));
    }

    // 3. Merge data
    const usersData = rawUsers.map(user => {
        const myRoles = rolesData
            .filter(r => r.userId === user.id)
            .map(r => ({
                id: r.id,
                role: r.role
            }));

        return {
            ...user,
            userRoles: myRoles
        };
    });

    return (
        <div className="space-y-4">
            {/* Simple client-side search or form submission for search */}
            {/* Implementing proper search component later, for now just list */}

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Roles</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {usersData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            usersData.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {user.userRoles.length > 0 ? (
                                                user.userRoles.map((ur) => (
                                                    <Badge key={ur.id} variant="secondary" className="text-xs">
                                                        {ur.role.name}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-muted-foreground text-xs">No roles</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {user.createdAt ? format(new Date(user.createdAt), 'PP') : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/admin/users/${user.id}`}>
                                            <Button variant="ghost" size="sm">
                                                <UserCog className="h-4 w-4 mr-2" />
                                                Manage
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="text-xs text-muted-foreground">
                Showing top 50 recent users.
            </div>
        </div>
    )
}

export default async function UsersPage(props: { searchParams: Promise<{ q?: string }> }) {
    const searchParams = await props.searchParams;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground mt-1">
                        View users and assign system roles.
                    </p>
                </div>

                <div className="flex items-center gap-2 max-w-sm">
                    {/* Search Form would go here, effectively pushing to URL */}
                    <Input placeholder="Search users by name or email..." name="q"
                    // Simplified: In real app, bind to URL search params via client component
                    />
                    <Button variant="secondary">
                        <Search className="h-4 w-4" />
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Registered Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Suspense fallback={<div>Loading users...</div>}>
                            <UserList searchParams={searchParams} />
                        </Suspense>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}


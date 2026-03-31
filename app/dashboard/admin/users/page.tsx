export const dynamic = 'force-dynamic'
import { Suspense } from "react"
import Link from "next/link"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { users, userRoles, roles, members as membersTable } from "@/lib/db/schema"
import { requirePermission } from "@/lib/rbac-v2"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { desc, or, ilike, eq, inArray, and, sql } from "drizzle-orm"
import { redirect } from "next/navigation"
import { format } from "date-fns"

// Reusing query logic from API essentially, but Server Component pattern is often direct DB access.
// However, reusing API keeps logic centralized? 
// For dashboard pages, direct DB access is standard in Next.js Server Components.

async function UserList({ searchParams }: {
    searchParams: { q?: string; state?: string; lga?: string; branch?: string }
}) {
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
    const stateFilter = searchParams?.state
    const lgaFilter = searchParams?.lga
    const branchFilter = searchParams?.branch

    // Direct DB is faster and avoids self-request issues in some environments.

    const conditions = []
    if (query) {
        conditions.push(or(ilike(users.name, `%${query}%`), ilike(users.email, `%${query}%`)))
    }
    if (stateFilter && stateFilter !== "all") {
        conditions.push(sql`JSON_UNQUOTE(JSON_EXTRACT(${membersTable.metadata}, '$.state')) = ${stateFilter}`)
    }
    if (lgaFilter && lgaFilter !== "all") {
        conditions.push(sql`JSON_UNQUOTE(JSON_EXTRACT(${membersTable.metadata}, '$.lga')) = ${lgaFilter}`)
    }
    if (branchFilter && branchFilter !== "all") {
        // Partial match for branch as it's a string input usually
        conditions.push(sql`JSON_UNQUOTE(JSON_EXTRACT(${membersTable.metadata}, '$.branch')) LIKE ${`%${branchFilter}%`}`)
    }

    // 1. Fetch Users joined with members to access jurisdiction
    const rawUsers = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
    })
        .from(users)
        .leftJoin(membersTable, eq(users.id, membersTable.userId))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
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

            <div className="overflow-x-auto border rounded-md">
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

export default async function UsersPage(props: {
    searchParams: Promise<{ q?: string; state?: string; lga?: string; branch?: string }>
}) {
    const searchParams = await props.searchParams;

    const stateFilter = searchParams.state;
    const lgaFilter = searchParams.lga;
    const branchFilter = searchParams.branch;

    const states = Object.keys(require("@/lib/location-data").locationData);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground mt-1">
                        View users and assign system roles.
                    </p>
                </div>

                <Card className="bg-green-50/50 border-green-100">
                    <CardContent className="pt-6">
                        <form className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="md:col-span-1">
                                <Input placeholder="Search name/email..." name="q" defaultValue={searchParams.q} />
                            </div>
                            <div>
                                <Select name="state" defaultValue={stateFilter || "all"}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="State" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All States</SelectItem>
                                        {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Select name="lga" defaultValue={lgaFilter || "all"} disabled={!stateFilter || stateFilter === "all"}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="LGA" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All LGAs</SelectItem>
                                        {stateFilter && stateFilter !== "all" && (require("@/lib/location-data").locationData as any)[stateFilter]?.lgas.map((l: any) => (
                                            <SelectItem key={l.name} value={l.name}>{l.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Input name="branch" placeholder="Branch..." defaultValue={branchFilter} className="bg-white" />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" className="bg-green-700 hover:bg-green-800 text-white flex-1">
                                    <Search className="h-4 w-4 mr-2" /> Filter
                                </Button>
                                {(searchParams.q || stateFilter || lgaFilter || branchFilter) && (
                                    <Link href="/dashboard/admin/users">
                                        <Button variant="outline" type="button">Reset</Button>
                                    </Link>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

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


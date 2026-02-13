export const dynamic = 'force-dynamic'
import { getBurialRequests } from "@/lib/actions/burial"
import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { DashboardLayout } from "@/components/layout/dashboard-layout"


export default async function AdminBurialsPage() {
    const session = await getServerSession()
    // TODO: Add proper admin check
    if (!session?.user) return redirect("/auth/login")

    const requests = await getBurialRequests()

    return (
        <DashboardLayout>
            <div className="container mx-auto py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Burial Requests Management</h1>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Deceased Name</TableHead>
                                <TableHead>Chanter/Requester</TableHead>
                                <TableHead>Date of Death</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">No requests found.</TableCell>
                                </TableRow>
                            ) : requests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">{req.deceasedName}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{req.user?.name || "Unknown"}</span>
                                            <span className="text-xs text-muted-foreground">{req.contactPhone}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell suppressHydrationWarning>{format(req.dateOfDeath, "PP")}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            req.status === 'PENDING' ? 'outline' :
                                                req.status === 'REJECTED' ? 'destructive' :
                                                    req.status === 'APPROVED_UNPAID' ? 'secondary' : 'default'
                                        }>
                                            {req.status?.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell suppressHydrationWarning>{format(req.createdAt!, "PP")}</TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/admin/burials/request/${req.id}`}>
                                            <Button variant="outline" size="sm">Review</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </DashboardLayout>
    )
}


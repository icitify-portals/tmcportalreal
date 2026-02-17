import { Suspense } from "react"
import { db } from "@/lib/db"
import { programmes, organizations } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { UploadPlannerDialog } from "@/components/admin/planner/upload-dialog"
import { SeedPlannerButton } from "@/components/admin/planner/seed-button"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

async function PlannerTable() {
    // Fetch all programmes for now, or filter by year
    // Identifying "Year Planner" items vs regular programmes:
    // Maybe we just show all? The request implies "Year Planner" IS the programmes list populated via Excel.

    // Fetch with organization info if needed, but for now just raw list
    const items = await db.select().from(programmes).orderBy(desc(programmes.startDate))

    if (items.length === 0) {
        return <div className="text-center py-10 text-muted-foreground">No planner items found. Upload an Excel file to get started.</div>
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap">
                            {format(new Date(item.startDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>{item.time}</TableCell>
                        <TableCell className="max-w-[300px]">
                            <div className="font-medium">{item.title}</div>
                            {item.committee && <div className="text-xs text-muted-foreground">Comm: {item.committee}</div>}
                        </TableCell>
                        <TableCell><Badge variant="outline">{item.frequency}</Badge></TableCell>
                        <TableCell><Badge variant="outline">{item.format}</Badge></TableCell>
                        <TableCell>{item.venue}</TableCell>
                        <TableCell>{formatCurrency(Number(item.budget))}</TableCell>
                        <TableCell><Badge>{item.status}</Badge></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

export default function PlannerPage() {
    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Year Planner</h2>
                    <div className="flex items-center space-x-2">
                        <SeedPlannerButton />
                        <UploadPlannerDialog />
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Planner Items</CardTitle>
                        <CardDescription>
                            Manage and view the generated year planner.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Suspense fallback={<div>Loading planner...</div>}>
                            <PlannerTable />
                        </Suspense>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}

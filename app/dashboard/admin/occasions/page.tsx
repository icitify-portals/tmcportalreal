export const dynamic = 'force-dynamic'

import { Suspense } from "react"
import { getAdminRequests, getOccasionTypes } from "@/lib/actions/occasions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ManageTypesDialog } from "@/components/admin/occasions/manage-types-dialog"
import { RequestActionDialog } from "@/components/admin/occasions/request-action-dialog"
import { PDFDownloadButton } from "@/components/occasions/pdf-download-button"
import { DashboardLayout } from "@/components/layout/dashboard-layout"


async function RequestsTable() {
    const requests = await getAdminRequests() // Fetch all for now. Filter by Organization later if needed.

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Cert</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {requests.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No requests found.
                        </TableCell>
                    </TableRow>
                ) : (
                    requests.map((req) => {
                        const hasCertificate = req.status === 'COMPLETED' && req.certificateNeeded
                        const details = req.details as any || {}
                        // Map data for certificate (Reused logic - should extract to helper)
                        const certData = {
                            type: req.type?.name || "Occasion",
                            certificateNo: req.certificateNo || "PENDING",
                            date: req.date,
                            location: req.venue,
                            husbandName: details.husbandName,
                            wifeName: details.wifeName,
                            dowry: details.dowry,
                            babyName: details.babyName,
                            fatherName: details.fatherName,
                            motherName: details.motherName,
                            dob: details.dob,
                        }

                        return (
                            <TableRow key={req.id}>
                                <TableCell>{format(new Date(req.date), "MMM d, yyyy")}<div className="text-xs text-muted-foreground">{req.time}</div></TableCell>
                                <TableCell>{req.type?.name}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{req.user?.name}</div>
                                    <div className="text-xs text-muted-foreground">{req.user?.email}</div>
                                </TableCell>
                                <TableCell>{req.venue}</TableCell>
                                <TableCell><Badge variant="outline">{req.role}</Badge></TableCell>
                                <TableCell>
                                    {req.certificateNeeded ? (
                                        <Badge variant={req.certificateNo ? "default" : "secondary"}>
                                            {req.certificateNo || "Required"}
                                        </Badge>
                                    ) : "-"}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={
                                        req.status === 'COMPLETED' ? 'default' :
                                            req.status === 'APPROVED' ? 'secondary' :
                                                req.status === 'REJECTED' ? 'destructive' : 'outline'
                                    }>
                                        {req.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    {/* Actions */}
                                    {req.status === 'PENDING' && (
                                        <>
                                            <RequestActionDialog request={req} mode="APPROVE" triggerText="Approve" />
                                            <RequestActionDialog request={req} mode="REJECT" triggerText="Reject" />
                                        </>
                                    )}
                                    {req.status === 'APPROVED' && (
                                        <RequestActionDialog request={req} mode="COMPLETE" triggerText="Complete" />
                                    )}
                                    {req.status === 'COMPLETED' && req.certificateNeeded && (
                                        <div className="inline-block">
                                            <PDFDownloadButton data={certData} fileName={`Copy-${req.type?.name}.pdf`} />
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        )
                    })
                )}
            </TableBody>
        </Table>
    )

}

async function SettingsTab() {
    const types = await getOccasionTypes()

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <ManageTypesDialog />
            </div>
            <Card>
                <CardHeader><CardTitle>Occasion Types</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Fee</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {types.map(t => (
                                <TableRow key={t.id}>
                                    <TableCell>{t.name}</TableCell>
                                    <TableCell>₦{t.certificateFee}</TableCell>
                                    <TableCell><Badge>Active</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

export default function AdminOccasionsPage() {
    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Engagements & Occasions</h2>
                </div>
                <Tabs defaultValue="requests" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="requests">Requests</TabsTrigger>
                        <TabsTrigger value="settings">Settings & Types</TabsTrigger>
                    </TabsList>
                    <TabsContent value="requests" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Occasion Requests</CardTitle>
                                <CardDescription>Manage incoming requests and status.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Suspense fallback={<div>Loading requests...</div>}>
                                    <RequestsTable />
                                </Suspense>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="settings" className="space-y-4">
                        <Suspense fallback={<div>Loading settings...</div>}>
                            <SettingsTab />
                        </Suspense>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}

export const dynamic = 'force-dynamic'
import { getBurialRequest } from "@/lib/actions/burial"
import { getServerSession } from "@/lib/session"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { AdminBurialActions } from "@/components/burial/admin-burial-actions"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"


export default async function AdminRequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await getServerSession()
    if (!session?.user) return redirect("/auth/login")

    const request = await getBurialRequest(id)
    if (!request) return notFound()

    return (
        <DashboardLayout>
            <div className="container mx-auto py-8 max-w-5xl">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/dashboard/admin/burials">
                        <Button variant="ghost" size="icon">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Request Review</h1>
                        <p className="text-muted-foreground">Manage burial request for {request.deceasedName}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm text-muted-foreground block">Deceased Name</span>
                                    <span className="font-medium text-lg">{request.deceasedName}</span>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground block">Requested By</span>
                                    <span className="font-medium">{request.user?.name || "Unknown"}</span>
                                    <span className="text-xs text-muted-foreground block">{request.user?.email || "No Email"}</span>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground block">Relationship</span>
                                    <span className="font-medium">{request.relationship}</span>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground block">Date of Death</span>
                                    <span className="font-medium">{format(request.dateOfDeath, "PPP p")}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-sm text-muted-foreground block">Place of Death</span>
                                    <span className="font-medium">{request.placeOfDeath}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-sm text-muted-foreground block">Cause of Death</span>
                                    <p className="mt-1 p-3 bg-muted rounded-md text-sm">{request.causeOfDeath}</p>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="font-semibold mb-3">Contact Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm text-muted-foreground block">Phone</span>
                                        <span className="font-medium">{request.contactPhone}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground block">Email</span>
                                        <span className="font-medium">{request.contactEmail}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Current Status</span>
                                    <Badge variant={
                                        request.status === 'PENDING' ? 'outline' :
                                            request.status === 'REJECTED' ? 'destructive' :
                                                request.status === 'APPROVED_UNPAID' ? 'secondary' : 'default'
                                    }>
                                        {request.status?.replace('_', ' ')}
                                    </Badge>
                                </div>

                                {request.rejectionReason && (
                                    <div className="p-3 bg-red-50 text-red-800 rounded text-sm">
                                        <strong>Rejection Reason:</strong> {request.rejectionReason}
                                    </div>
                                )}

                                {/* Admin Actions */}
                                <AdminBurialActions
                                    requestId={request.id}
                                    status={request.status || 'PENDING'}
                                    userId={session.user.id}
                                />
                            </CardContent>
                        </Card>

                        {request.certificate && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Certificate</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-muted-foreground">Number</span>
                                        <span className="font-mono font-bold">{request.certificate.certificateNumber}</span>
                                    </div>
                                    <Button variant="outline" className="w-full">Download PDF</Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

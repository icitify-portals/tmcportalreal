export const dynamic = 'force-dynamic'
import { getBurialRequest } from "@/lib/actions/burial"
import { getServerSession } from "@/lib/session"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { FileText, CreditCard, CheckCircle } from "lucide-react"

export default async function RequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await getServerSession()
    if (!session?.user) return redirect("/auth/login")

    const request = await getBurialRequest(id)
    if (!request) return notFound()

    if (request.userId !== session.user.id) {
        // Basic authorization check - strictly usually should be in data fetch or middleware
        return <div>Unauthorized</div>
    }

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-4xl">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Request Details</h1>
                    <p className="text-muted-foreground">View the status and details of your burial request.</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Badge className="text-lg px-4 py-1" variant={
                        request.status === 'PENDING' ? 'outline' :
                            request.status === 'REJECTED' ? 'destructive' :
                                request.status === 'APPROVED_UNPAID' ? 'secondary' : 'default'
                    }>
                        {request.status?.replace('_', ' ')}
                    </Badge>
                    {request.rejectionReason && (
                        <p className="text-sm text-destructive max-w-xs text-right">Reason: {request.rejectionReason}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Deceased Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-muted-foreground">Name</span>
                                <p className="font-medium">{request.deceasedName}</p>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground">Relationship</span>
                                <p className="font-medium">{request.relationship}</p>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground">Date of Death</span>
                                <p className="font-medium">{format(request.dateOfDeath, "PPP p")}</p>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground">Place of Death</span>
                                <p className="font-medium">{request.placeOfDeath}</p>
                            </div>
                            <div className="col-span-2">
                                <span className="text-sm text-muted-foreground">Cause of Death</span>
                                <p className="font-medium">{request.causeOfDeath}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 flex flex-col">
                        {request.status === 'APPROVED_UNPAID' && (
                            <Button className="w-full">
                                <CreditCard className="mr-2 h-4 w-4" />
                                Pay Verification Fee
                            </Button>
                        )}

                        {(request.status === 'PAID' || request.status === 'BURIAL_DONE') && (
                            <div className="p-4 bg-muted rounded-lg flex items-center gap-3">
                                <FileText className="h-5 w-5 text-primary" />
                                <div className="flex-1">
                                    <p className="font-medium text-sm">Burial Approval</p>
                                    <p className="text-xs text-muted-foreground">Ready for download</p>
                                </div>
                                <Button size="sm" variant="outline">Download</Button>
                            </div>
                        )}

                        {request.status === 'BURIAL_DONE' && request.certificate && (
                            <div className="p-4 bg-primary/10 rounded-lg flex items-center gap-3 border border-primary/20">
                                <CheckCircle className="h-5 w-5 text-primary" />
                                <div className="flex-1">
                                    <p className="font-medium text-sm">Burial Certificate</p>
                                    <p className="text-xs text-muted-foreground">#{request.certificate.certificateNumber}</p>
                                </div>
                                <Button size="sm">Download</Button>
                            </div>
                        )}

                        {/* Contact Info Display for reference */}
                        <div className="pt-4 border-t mt-4">
                            <p className="text-sm font-semibold mb-2">Contact Info Provided</p>
                            <p className="text-sm text-muted-foreground">{request.contactPhone}</p>
                            <p className="text-sm text-muted-foreground">{request.contactEmail}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

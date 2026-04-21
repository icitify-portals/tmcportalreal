import { Suspense } from "react"
import { getUserRequests, getOccasionTypes, getAvailableOrganizations } from "@/lib/actions/occasions"
import { RequestOccasionDialog } from "@/components/occasions/request-dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { PDFDownloadButton } from "@/components/occasions/pdf-download-button"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { OccasionPaymentButton } from "@/components/occasions/occasion-payment-button"
import { auth } from "@/auth"


export const dynamic = "force-dynamic"

async function OccasionsList({ userEmail }: { userEmail: string }) {
    const requests = await getUserRequests()


    if (requests.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed rounded-lg mt-8">
                <p className="text-muted-foreground">No occasion requests found.</p>
            </div>
        )
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
            {requests.map((req) => {
                const details = req.details as any || {}
                const isCompleted = req.status === 'COMPLETED'
                const hasCertificate = req.certificateNeeded && isCompleted

                // Map data for certificate
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
                    <Card key={req.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle>{req.type?.name}</CardTitle>
                                <Badge variant={
                                    req.status === 'COMPLETED' ? 'default' :
                                        req.status === 'APPROVED' ? 'secondary' :
                                            req.status === 'REJECTED' ? 'destructive' : 'outline'
                                }>
                                    {req.status}
                                </Badge>
                            </div>
                            <CardDescription>{format(new Date(req.date), "PPP")} at {req.time}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm"><strong>Venue:</strong> {req.venue}</p>
                            <p className="text-sm"><strong>Role:</strong> {req.role}</p>
                            <p className="text-sm"><strong>Org:</strong> {req.organizationName}</p>
                            {req.certificateNeeded && (
                                <p className="text-xs text-muted-foreground mt-2">Certificate requested {req.amount && `(Fee: ${req.amount})`}</p>
                            )}
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2">
                            {hasCertificate ? (
                                <PDFDownloadButton
                                    data={certData}
                                    fileName={`${req.type?.name}-Certificate.pdf`}
                                />
                            ) : req.status === 'APPROVED' && req.paymentStatus !== "SUCCESS" && req.certificateNeeded && parseFloat(req.amount?.toString() || "0") > 0 ? (
                                <OccasionPaymentButton
                                    amount={parseFloat(req.amount?.toString() || "0")}
                                    email={userEmail}
                                    requestId={req.id}
                                    occasionType={req.type?.name || "Occasion"}
                                />
                            ) : (
                                <span className="text-xs text-muted-foreground italic text-center w-full">
                                    {req.status === 'COMPLETED' ? "No certificate" :
                                        req.status === 'APPROVED' ? (req.certificateNeeded ? "Awaiting Payment" : "Approved") :
                                            "Processing..."}
                                </span>
                            )}
                        </CardFooter>

                    </Card>
                )
            })}
        </div>
    )
}


export default async function MemberOccasionsPage() {
    const session = await auth()
    const types = await getOccasionTypes()
    const orgs = await getAvailableOrganizations()


    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">My Occasions</h2>
                    <RequestOccasionDialog types={types} organizations={orgs} />
                </div>

                <Suspense fallback={<div>Loading...</div>}>
                    <OccasionsList userEmail={session?.user?.email || ""} />
                </Suspense>

            </div>
        </DashboardLayout>
    )
}

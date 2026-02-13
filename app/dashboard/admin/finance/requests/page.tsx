export const dynamic = 'force-dynamic'
import { getRequests, recommendRequest, approveRequest, disburseRequest } from "@/lib/actions/finance"
import { CreateRequestDialog } from "@/components/admin/finance/create-request-dialog"
import { getServerSession } from "@/lib/session"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDate } from "@/lib/utils"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DashboardLayout } from "@/components/layout/dashboard-layout"


export default async function RequestsPage() {
    const session = await getServerSession()
    if (!session?.user?.id) return notFound()
    const currentUserId = session.user.id

    const organizationId = "default-org-id" // TODO: Real context

    const requests = await getRequests(organizationId) || []

    // Helper to determine badge color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'secondary'
            case 'RECOMMENDED': return 'outline' // Example
            case 'APPROVED': return 'default'
            case 'DISBURSED': return 'default' // Maybe green
            case 'REJECTED': return 'destructive'
            default: return 'secondary'
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Fund Requests</h3>
                    <CreateRequestDialog organizationId={organizationId} />
                </div>

                <Tabs defaultValue="all" className="w-full">
                    <TabsList>
                        <TabsTrigger value="all">All Requests</TabsTrigger>
                        <TabsTrigger value="pending">Pending Recommendation</TabsTrigger>
                        <TabsTrigger value="approval">Pending Approval</TabsTrigger>
                        <TabsTrigger value="disbursement">Pending Disbursement</TabsTrigger>
                    </TabsList>

                    {['all', 'pending', 'approval', 'disbursement'].map((tab) => (
                        <TabsContent key={tab} value={tab} className="space-y-4 mt-4">
                            {requests.filter(r => {
                                if (tab === 'all') return true
                                if (tab === 'pending') return r.status === 'PENDING'
                                if (tab === 'approval') return r.status === 'RECOMMENDED'
                                if (tab === 'disbursement') return r.status === 'APPROVED' // Ready for disbursement
                                return false
                            }).map(request => (
                                <Card key={request.id}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle>{request.title}</CardTitle>
                                                <CardDescription>
                                                    Requested by {request.requester?.name} on {formatDate(request.createdAt || new Date())}
                                                </CardDescription>
                                            </div>
                                            <Badge variant={getStatusColor(request.status || 'PENDING') as any}>
                                                {request.status}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 bg-muted/50 p-3 rounded">
                                            {request.description}
                                        </p>
                                        <div className="font-bold text-xl">
                                            {formatCurrency(request.amount)}
                                        </div>

                                        {/* Workflow History */}
                                        <div className="mt-4 text-xs text-muted-foreground space-y-1">
                                            {request.recommendedBy && (
                                                <div>✓ Recommended by {request.recommender?.name}</div>
                                            )}
                                            {request.approvedBy && (
                                                <div>✓ Approved by {request.approver?.name}</div>
                                            )}
                                            {request.disbursedBy && (
                                                <div className="text-green-600 dark:text-green-400">✓ Disbursed</div>
                                            )}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex gap-2 justify-end border-t pt-4">
                                        {/* Recommendation Action */}
                                        {request.status === 'PENDING' && (
                                            <form action={async () => {
                                                "use server"
                                                await recommendRequest(request.id)
                                            }}>
                                                <Button size="sm" variant="outline">Recommend (Finance)</Button>
                                            </form>
                                        )}

                                        {/* Approval Action */}
                                        {request.status === 'RECOMMENDED' && (
                                            <form action={async () => {
                                                "use server"
                                                await approveRequest(request.id)
                                            }}>
                                                <Button size="sm">Approve (Head)</Button>
                                            </form>
                                        )}

                                        {/* Disbursement Action */}
                                        {request.status === 'APPROVED' && (
                                            <form action={async () => {
                                                "use server"
                                                await disburseRequest(request.id)
                                            }}>
                                                <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700">
                                                    Disburse Funds
                                                </Button>
                                            </form>
                                        )}
                                    </CardFooter>
                                </Card>
                            ))}
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </DashboardLayout>
    )
}


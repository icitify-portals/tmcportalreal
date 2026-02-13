export const dynamic = 'force-dynamic'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Link from "next/link"
import { getServerSession } from "@/lib/session"
import { getUserBurialRequests } from "@/lib/actions/burial"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

export default async function BurialPage() {
    const session = await getServerSession()
    if (!session?.user) return <div>Please login to view this page</div>

    const requests = await getUserBurialRequests()

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Burial Services</h1>
                    <p className="text-muted-foreground">Request and manage burial services for your loved ones.</p>
                </div>
                <Link href="/dashboard/burial/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Request
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Your Requests</CardTitle>
                        <CardDescription>History of your burial service requests.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {requests.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No requests found. Click "New Request" to start.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {requests.map((req) => (
                                    <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-semibold">{req.deceasedName}</span>
                                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                Status: <Badge variant={req.status === 'PENDING' ? 'outline' : 'default'}>{req.status}</Badge>
                                            </div>
                                            <span className="text-xs text-muted-foreground" suppressHydrationWarning>Submitted on {format(req.createdAt!, "PPP")}</span>
                                        </div>
                                        <Link href={`/dashboard/burial/request/${req.id}`}>
                                            <Button variant="outline" size="sm">View Details</Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}


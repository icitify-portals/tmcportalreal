import { auth } from "@/auth"
import { getPromotionsSimple } from "@/lib/actions/promotions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { PromotionPaymentButton } from "@/components/user/promotions/payment-button"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export const dynamic = "force-dynamic"

export default async function UserPromotionsPage() {
    const session = await auth()
    if (!session?.user?.id) return null // Or redirect

    const promotions = await getPromotionsSimple(session.user.id)

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My Promotions</h1>
                        <p className="text-muted-foreground">Manage your advertisements and track their status.</p>
                    </div>
                    <Button asChild>
                        <Link href="/dashboard/user/promotions/new">
                            <Plus className="w-4 h-4 mr-2" /> New Request
                        </Link>
                    </Button>
                </div>

                {promotions.length === 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>No promotions found</CardTitle>
                            <CardDescription>You haven't requested any advertisements yet.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="outline">
                                <Link href="/dashboard/user/promotions/new">Create your first promotion</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {promotions.map((promo) => (
                            <Card key={promo.id} className="overflow-hidden">
                                <div className="relative h-48 w-full bg-muted">
                                    {/* Image Preview */}
                                    <Image
                                        src={promo.imageUrl}
                                        alt={promo.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <CardHeader className="p-4">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg line-clamp-1">{promo.title}</CardTitle>
                                        <Badge variant={
                                            promo.status === 'ACTIVE' || promo.status === 'APPROVED' ? 'default' :
                                                promo.status === 'PENDING' ? 'outline' : 'destructive'
                                        }>
                                            {promo.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Plan:</span>
                                        <span>{promo.plan?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Amount:</span>
                                        <span>₦{parseFloat(promo.amount).toLocaleString()}</span>
                                    </div>
                                    {promo.rejectionReason && (
                                        <div className="bg-destructive/10 text-destructive p-2 rounded text-xs mt-2">
                                            Reason: {promo.rejectionReason}
                                        </div>
                                    )}
                                </CardContent>
                                <div className="p-4 pt-0">
                                    {promo.paymentStatus !== 'SUCCESS' && promo.status !== 'REJECTED' && (
                                        <PromotionPaymentButton
                                            amount={parseFloat(promo.amount.toString())}
                                            email={session.user.email || ""}
                                            promotionId={promo.id}
                                            title={promo.title}
                                        />
                                    )}
                                    {promo.paymentStatus === 'SUCCESS' && (
                                        <div className="text-center text-sm text-green-600 font-medium py-2 border border-green-200 rounded bg-green-50">
                                            Paid
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}



export const dynamic = 'force-dynamic'
import { db } from "@/lib/db"
import { promotions, users, promotionPlans } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPromotionsSimple, updatePromotionStatus } from "@/lib/actions/promotions"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import Image from "next/image"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Check, X, Eye } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

// Server Action Wrapper for buttons (or client component)
// For simplicity, I'll make this a Server Component that renders Client Components for actions if needed.
// Actually, using a form with server action is easiest for "Approve/Reject".

export default async function AdminPromotionsPage() {
    // Fetch all promotions (admin view)
    // We already have a server action for this, but might need to adjust it to return everything.
    // simpler to just query directly here for full control or use getPromotionsSimple

    // Use getPromotionsSimple which is already fixed for MariaDB compatibility
    const allPromotions = await getPromotionsSimple();

    const pendingPromotions = allPromotions.filter(p => p.status === 'PENDING');
    const activePromotions = allPromotions.filter(p => p.status === 'ACTIVE' || p.status === 'APPROVED');
    const historyPromotions = allPromotions.filter(p => p.status === 'REJECTED' || p.status === 'EXPIRED');

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Promotion Requests</h1>
                        <p className="text-muted-foreground">Review and manage user advertisement requests.</p>
                    </div>
                </div>

                <Tabs defaultValue="pending" className="w-full">
                    <TabsList>
                        <TabsTrigger value="pending">Pending Review ({pendingPromotions.length})</TabsTrigger>
                        <TabsTrigger value="active">Active Ads ({activePromotions.length})</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending" className="space-y-4">
                        {pendingPromotions.length === 0 ? (
                            <Card>
                                <CardContent className="pt-6 text-center text-muted-foreground">
                                    No pending promotion requests.
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {pendingPromotions.map(promo => (
                                    <PromotionCard key={promo.id} promo={promo} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="active" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {activePromotions.map(promo => (
                                <PromotionCard key={promo.id} promo={promo} isReadOnly />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {historyPromotions.map(promo => (
                                <PromotionCard key={promo.id} promo={promo} isReadOnly />
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}

function PromotionCard({ promo, isReadOnly = false }: { promo: any, isReadOnly?: boolean }) {
    return (
        <Card className="overflow-hidden">
            <div className="relative h-48 w-full bg-muted">
                {/* Image Preview */}
                <Image
                    src={promo.imageUrl}
                    alt={promo.title}
                    fill
                    className="object-cover transition-all hover:scale-105"
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
                <CardDescription className="line-clamp-2">
                    {promo.link ? <span className="text-blue-500">{promo.link}</span> : "No link provided"}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Plan:</span>
                    <span className="font-medium">{promo.plan?.name} (₦{parseFloat(promo.amount).toLocaleString()})</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">User:</span>
                    <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                            <AvatarImage src={promo.user?.image || ""} />
                            <AvatarFallback>{promo.user?.name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <span>{promo.user?.name}</span>
                    </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Submitted:</span>
                    <span>{format(new Date(promo.createdAt), 'MMM d, yyyy')}</span>
                </div>

                {!isReadOnly && promo.status === 'PENDING' && (
                    <div className="flex gap-2 pt-2">
                        <form action={async () => {
                            'use server'
                            await updatePromotionStatus(promo.id, 'APPROVED')
                        }} className="flex-1">
                            <Button className="w-full bg-green-600 hover:bg-green-700" size="sm">
                                <Check className="w-4 h-4 mr-1" /> Approve
                            </Button>
                        </form>
                        <form action={async () => {
                            'use server'
                            await updatePromotionStatus(promo.id, 'REJECTED', 'By Admin')
                        }} className="flex-1">
                            <Button variant="destructive" className="w-full" size="sm">
                                <X className="w-4 h-4 mr-1" /> Reject
                            </Button>
                        </form>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export const dynamic = 'force-dynamic'
import { db } from "@/lib/db"
import { promotionPlans } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlanForm } from "@/components/admin/promotions/plan-form"
import { getPromotionPlans } from "@/lib/actions/promotions"
import { formatCurrency } from "@/lib/utils" // Assuming this exists, otherwise I'll inline checks

export default async function PromotionPlansPage() {
    const plans = await getPromotionPlans(true)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Promotion Plans</h1>
                    <p className="text-muted-foreground">Define pricing packages for advertisements.</p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>Create New Plan</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create Promotion Plan</DialogTitle>
                            <DialogDescription>
                                Add a new pricing tier for promotions.
                            </DialogDescription>
                        </DialogHeader>
                        <PlanForm />
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Plans</CardTitle>
                    <CardDescription>Manage your existing promotion packages.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {plans.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No promotion plans found. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                plans.map((plan) => (
                                    <TableRow key={plan.id}>
                                        <TableCell className="font-medium">
                                            <div>{plan.name}</div>
                                            {plan.description && (
                                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                    {plan.description}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>{plan.durationDays} Days</TableCell>
                                        {/* Inline currency formatting if util missing */}
                                        <TableCell>₦{parseFloat(plan.amount).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={plan.isActive ? "default" : "secondary"}>
                                                {plan.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {/* Add Edit/Toggle actions later */}
                                            <Button variant="ghost" size="sm">Edit</Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

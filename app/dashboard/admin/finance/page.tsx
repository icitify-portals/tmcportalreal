export const dynamic = 'force-dynamic'

import React from 'react';
import { db } from "@/lib/db";
import { payments, users, organizations } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminFinancePage() {
    // Fetch payments with organization info
    // Drizzle relation query or manual join.
    // Let's use db.query.payments.findMany with relations if set up, or just basic fetch.
    // The schema has relations set up.

    // Fetch payments without relations to avoid LATERAL JOIN issues
    const rawPayments = await db.query.payments.findMany({
        orderBy: [desc(payments.createdAt)]
    });

    // Manually fetch related data
    const orgIds = [...new Set(rawPayments.map(p => p.organizationId).filter(Boolean))] as string[];
    const userIds = [...new Set(rawPayments.map(p => p.userId).filter(Boolean))] as string[];

    const orgs = orgIds.length > 0 ? await db.query.organizations.findMany({
        where: (organizations, { inArray }) => inArray(organizations.id, orgIds)
    }) : [];

    const usersData = userIds.length > 0 ? await db.query.users.findMany({
        where: (users, { inArray }) => inArray(users.id, userIds)
    }) : [];

    const allPayments = rawPayments.map(p => ({
        ...p,
        organization: orgs.find(o => o.id === p.organizationId) || null,
        user: usersData.find(u => u.id === p.userId) || null
    }));

    const totalAmount = allPayments.reduce((acc, p) => acc + parseFloat(p.amount.toString()), 0);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/admin/finance/campaigns">
                            <Button>
                                Manage Campaigns
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* ... existing content ... */}

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                className="h-4 w-4 text-muted-foreground"
                            >
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₦{totalAmount.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Lifetime collected</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{allPayments.length}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>
                            A list of all payments and donations across jurisdictions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Payer</TableHead>
                                    <TableHead>Jurisdiction</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allPayments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24">No transactions found.</TableCell>
                                    </TableRow>
                                ) : (
                                    allPayments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell className="font-medium">
                                                {format(new Date(payment.createdAt || new Date()), 'MMM d, yyyy HH:mm')}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{payment.paystackRef}</TableCell>
                                            <TableCell>
                                                {payment.user?.name || (payment.metadata as any)?.email || "Anonymous"}
                                            </TableCell>
                                            <TableCell>
                                                {payment.organization?.name || (
                                                    <div className="flex flex-col text-xs text-muted-foreground">
                                                        <span>{(payment.metadata as any)?.jurisdiction?.level}</span>
                                                        <span>{(payment.metadata as any)?.jurisdiction?.branch || (payment.metadata as any)?.jurisdiction?.state}</span>
                                                    </div>
                                                ) || "N/A"}
                                            </TableCell>
                                            <TableCell>{payment.paymentType}</TableCell>
                                            <TableCell>₦{parseFloat(payment.amount.toString()).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={payment.status === 'SUCCESS' ? 'default' : 'secondary'}>
                                                    {payment.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

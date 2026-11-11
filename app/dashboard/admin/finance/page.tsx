export const dynamic = 'force-dynamic'

import React from 'react';
import { db } from "@/lib/db";
import { payments, users, organizations, fundraisingCampaigns, members } from "@/lib/db/schema";
import { desc, inArray } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SyncPaymentsButton } from "@/components/admin/finance/sync-payments-button";
import { ExportCSV } from "@/components/admin/shared/export-csv";

export default async function AdminFinancePage() {
    // 1. Fetch comprehensive payments for export and statistics (up to 10,000 records)
    const rawPayments = await db.query.payments.findMany({
        orderBy: [desc(payments.createdAt)],
        limit: 10000
    });

    // 2. Extract related IDs
    const orgIds = [...new Set(rawPayments.map(p => p.organizationId).filter(Boolean))] as string[];
    const userIds = [...new Set(rawPayments.map(p => p.userId).filter(Boolean))] as string[];
    const campaignIds = [...new Set(rawPayments.map(p => p.campaignId).filter(Boolean))] as string[];
    const memberIds = [...new Set(rawPayments.map(p => p.memberId).filter(Boolean))] as string[];

    // 3. Batch fetch relations
    const [orgs, usersData, campaigns, membersData] = await Promise.all([
        orgIds.length > 0 ? db.query.organizations.findMany({
            where: inArray(organizations.id, orgIds)
        }) : Promise.resolve([]),
        userIds.length > 0 ? db.query.users.findMany({
            where: inArray(users.id, userIds),
            columns: { id: true, name: true, email: true, phone: true }
        }) : Promise.resolve([]),
        campaignIds.length > 0 ? db.query.fundraisingCampaigns.findMany({
            where: inArray(fundraisingCampaigns.id, campaignIds),
            columns: { id: true, title: true }
        }) : Promise.resolve([]),
        memberIds.length > 0 ? db.query.members.findMany({
            where: inArray(members.id, memberIds),
            columns: { id: true, memberId: true }
        }) : Promise.resolve([]),
    ]);

    // 4. Merge relations
    const allPayments = rawPayments.map(p => {
        const org = orgs.find(o => o.id === p.organizationId) || null;
        const user = usersData.find(u => u.id === p.userId) || null;
        const campaign = campaigns.find(c => c.id === p.campaignId) || null;
        const member = membersData.find(m => m.id === p.memberId) || null;

        return {
            ...p,
            organization: org,
            user,
            campaign,
            member,
        };
    });

    // 5. Total revenue (successful payments only if available, or total amount)
    const totalAmount = allPayments
        .filter(p => !p.status || p.status === 'SUCCESS' || (p as any).paymentStatus === 'SUCCESS')
        .reduce((acc, p) => acc + parseFloat(p.amount.toString()), 0);

    const totalSuccessfulCount = allPayments.filter(p => !p.status || p.status === 'SUCCESS' || (p as any).paymentStatus === 'SUCCESS').length;

    // 6. Prepare comprehensive export rows with all fields
    const exportRows = allPayments.map(p => {
        let meta: any = {};
        if (p.metadata) {
            try {
                meta = typeof p.metadata === "string" ? JSON.parse(p.metadata) : p.metadata;
            } catch (e) {
                meta = {};
            }
        }

        let paystackResp: any = {};
        if (p.paystackResponse) {
            try {
                paystackResp = typeof p.paystackResponse === "string" ? JSON.parse(p.paystackResponse) : p.paystackResponse;
            } catch (e) {
                paystackResp = {};
            }
        }

        const jur = meta.jurisdiction || {};
        const orgName = p.organization?.name || jur.branch || jur.state || jur.lga || "National";
        const level = p.organization?.level || jur.level || (jur.branch ? "Branch" : jur.lga ? "LGA" : jur.state ? "State" : "National");

        const payerName = p.user?.name || meta.fullName || meta.name || meta.donorName || (meta.email ? meta.email.split("@")[0] : "Anonymous");
        const payerEmail = p.user?.email || meta.email || "";
        const payerPhone = p.user?.phone || meta.phone || "";
        const memberIdStr = p.member?.memberId || meta.memberId || "";

        return {
            id: p.id,
            date: p.createdAt ? format(new Date(p.createdAt), 'yyyy-MM-dd HH:mm:ss') : "",
            paidAt: p.paidAt ? format(new Date(p.paidAt), 'yyyy-MM-dd HH:mm:ss') : "",
            reference: p.paystackRef || "",
            payerName,
            payerEmail,
            payerPhone,
            memberId: memberIdStr,
            amount: parseFloat(p.amount.toString()).toFixed(2),
            currency: p.currency || "NGN",
            status: p.status || (p as any).paymentStatus || "PENDING",
            paymentType: p.paymentType || "",
            description: (p.description || "").replace(/[\r\n]+/g, " "),
            organization: orgName,
            jurisdictionLevel: level,
            state: jur.state || "",
            lga: jur.lga || "",
            branch: jur.branch || "",
            campaign: p.campaign?.title || meta.campaignTitle || "",
            channel: meta.channel || paystackResp.channel || paystackResp.bank || "Paystack",
            gatewayRef: paystackResp.trans || paystackResp.transaction || "",
        };
    });

    const csvHeaders = [
        { key: "date", label: "Date & Time" },
        { key: "reference", label: "Transaction Reference" },
        { key: "payerName", label: "Payer Name" },
        { key: "payerEmail", label: "Payer Email" },
        { key: "payerPhone", label: "Payer Phone" },
        { key: "memberId", label: "Member ID" },
        { key: "amount", label: "Amount (NGN)" },
        { key: "currency", label: "Currency" },
        { key: "status", label: "Payment Status" },
        { key: "paymentType", label: "Payment Type" },
        { key: "description", label: "Description / Purpose" },
        { key: "organization", label: "Jurisdiction / Organization" },
        { key: "jurisdictionLevel", label: "Jurisdiction Level" },
        { key: "state", label: "State" },
        { key: "lga", label: "LGA" },
        { key: "branch", label: "Branch" },
        { key: "campaign", label: "Campaign" },
        { key: "channel", label: "Payment Channel" },
        { key: "gatewayRef", label: "Gateway Transaction ID" },
        { key: "id", label: "Internal Payment ID" },
    ];

    // For table display, take the latest 50
    const displayedPayments = allPayments.slice(0, 50);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Monitor revenue, donations, dues, and transaction histories across all jurisdictions.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <ExportCSV
                        data={exportRows}
                        filename="tmc_finance_transactions"
                        headers={csvHeaders}
                        buttonText="Download CSV"
                    />
                    <SyncPaymentsButton />
                    <Link href="/dashboard/admin/finance/campaigns">
                        <Button>
                            Manage Campaigns
                        </Button>
                    </Link>
                </div>
            </div>

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
                        <div className="text-2xl font-bold">₦{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground mt-1">Successful transactions total ({totalSuccessfulCount})</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{allPayments.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {allPayments.length > 50 ? `Displaying 50, all ${allPayments.length} in CSV` : "All records displayed"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle>Transaction History</CardTitle>
                        <CardDescription>
                            Latest successful payments, donations, and member dues. (Showing {displayedPayments.length} of {allPayments.length} records)
                        </CardDescription>
                    </div>
                    <ExportCSV
                        data={exportRows}
                        filename="tmc_finance_transactions"
                        headers={csvHeaders}
                        buttonText="Download CSV"
                    />
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
                            {displayedPayments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">No transactions found.</TableCell>
                                </TableRow>
                            ) : (
                                displayedPayments.map((payment) => {
                                    const meta = (payment.metadata as any) || {};
                                    const jur = meta.jurisdiction || {};
                                    const orgName = payment.organization?.name || jur.branch || jur.state || jur.lga || "N/A";
                                    const payer = payment.user?.name || meta.fullName || meta.name || meta.email || "Anonymous";

                                    return (
                                        <TableRow key={payment.id}>
                                            <TableCell className="font-medium">
                                                {format(new Date(payment.createdAt || new Date()), 'MMM d, yyyy HH:mm')}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{payment.paystackRef}</TableCell>
                                            <TableCell>
                                                {payer}
                                            </TableCell>
                                            <TableCell>
                                                {orgName}
                                            </TableCell>
                                            <TableCell>{payment.paymentType}</TableCell>
                                            <TableCell>₦{parseFloat(payment.amount.toString()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                            <TableCell>
                                                <Badge variant={payment.status === 'SUCCESS' ? 'default' : 'secondary'}>
                                                    {payment.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

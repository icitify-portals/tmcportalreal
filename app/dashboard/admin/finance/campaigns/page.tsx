export const dynamic = 'force-dynamic'

import React from 'react';
import { db } from "@/lib/db";
import { fundraisingCampaigns, organizations, userRoles } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CreateCampaignDialog } from "@/components/admin/finance/create-campaign-dialog";
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export default async function CampaignsPage() {
    const session = await getServerSession();
    if (!session?.user?.id) return redirect("/login");

    // Fetch user's organization context. Assuming admin logic handles this or we fetch active one.
    // For now, let's look for one organization they manage or belong to?
    // In this app structure, it seems we might need to rely on the role or user relation.
    // Let's assume the user is an admin of 'some' organization and pick the first one from DB if managing multiple, 
    // or use a context if available. 
    // Actually, looking at `app/dashboard/admin/finance/page.tsx` it did NOT filter by organization? 
    // Wait, `app/dashboard/admin/finance/page.tsx` fetched ALL payments (superuser view?).
    // But `getBudgets` takes `organizationId`. 
    // Let's assume we want to show campaigns for the user's specific organization.

    // Simplification: Fetch User's first related organization.


    // Proper way based on schema:
    // user_roles has userId and organizationId.
    // Let's get the first organizationId for this user.
    // Refactored to avoid LATERAL join error with db.query
    const userOrgLinks = await db.select({
        organizationId: userRoles.organizationId,
        organization: organizations
    })
        .from(userRoles)
        .leftJoin(organizations, eq(userRoles.organizationId, organizations.id))
        .where(eq(userRoles.userId, session.user.id))
        .limit(1);

    const userOrgLink = userOrgLinks[0];

    const organizationId = userOrgLink?.organizationId;
    const organizationCode = userOrgLink?.organization?.code;

    if (!organizationId) {
        return (
            <DashboardLayout>
                <div className="p-4">You do not have an organization assigned.</div>
            </DashboardLayout>
        )
    }

    const campaigns = await db.query.fundraisingCampaigns.findMany({
        where: eq(fundraisingCampaigns.organizationId, organizationId),
        orderBy: [desc(fundraisingCampaigns.createdAt)]
    });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Fundraising Campaigns</h1>
                        <p className="text-muted-foreground">Manage your fundraising efforts and track donations.</p>
                    </div>
                    <CreateCampaignDialog organizationId={organizationId} />
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {campaigns.map((campaign) => {
                        const target = parseFloat(campaign.targetAmount || "0");
                        const raised = parseFloat(campaign.raisedAmount || "0");
                        const percentage = target > 0 ? (raised / target) * 100 : 0;

                        return (
                            <Card key={campaign.id} className="flex flex-col">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                            {campaign.status}
                                        </Badge>
                                        <Link href={`/${organizationCode}/campaigns/${campaign.slug}`} target="_blank">
                                            <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                        </Link>
                                    </div>
                                    <CardTitle className="mt-2 line-clamp-1">{campaign.title}</CardTitle>
                                    <CardDescription className="line-clamp-2">
                                        {campaign.description || "No description"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="mt-auto space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Raised</span>
                                            <span className="font-medium">₦{raised.toLocaleString()}</span>
                                        </div>
                                        <Progress value={percentage} className="h-2" />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>{percentage.toFixed(1)}%</span>
                                            <span>Goal: ₦{target.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Started {format(new Date(campaign.startDate || new Date()), "MMM d, yyyy")}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                    {campaigns.length === 0 && (
                        <div className="col-span-full text-center py-10 text-muted-foreground">
                            No campaigns found. Create one to get started.
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}


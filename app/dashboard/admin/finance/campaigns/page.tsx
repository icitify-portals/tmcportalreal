import React from 'react';
import { db } from "@/lib/db";
import { fundraisingCampaigns, organizations, userRoles } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { CampaignsClientView } from "@/components/admin/finance/campaigns-client-view";

export default async function CampaignsPage() {
    const session = await getServerSession();
    if (!session?.user?.id) return redirect("/login");

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

    const campaigns = await db.query.fundraisingCampaigns.findMany({
        where: organizationId && !session.user.isSuperAdmin ? eq(fundraisingCampaigns.organizationId, organizationId) : undefined,
        orderBy: [desc(fundraisingCampaigns.createdAt)]
    });

    return (
        <div className="space-y-6">
            <CampaignsClientView
                campaigns={campaigns as any}
                organizationId={organizationId || ""}
                organizationCode={organizationCode || "national"}
            />
        </div>
    );
}


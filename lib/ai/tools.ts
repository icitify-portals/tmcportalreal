import { db } from "@/lib/db";
import { payments, members, fundraisingCampaigns, users, organizations } from "@/lib/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { tool } from "ai";
import { z } from "zod";

export const aiTools = {
    // Placeholder if needed
};

// We will export factory functions that take the userId
export const createTools = (userId: string) => ({
    getPayments: tool({
        description: "Get payment history for the current user. Use this when the user asks about their payments, dues, or donations.",
        parameters: z.object({}),
        execute: async (_args: any) => {
            try {
                if (!userId) return "User not logged in.";

                const userPayments = await db.query.payments.findMany({
                    where: eq(payments.userId, userId),
                    orderBy: desc(payments.createdAt),
                    limit: 10,
                    with: {
                        campaign: true
                    }
                });

                if (!userPayments.length) return "No payment history found.";

                return JSON.stringify(userPayments.map(p => ({
                    amount: p.amount,
                    currency: p.currency,
                    status: p.status,
                    type: p.paymentType,
                    date: p.createdAt,
                    description: p.description || p.campaign?.title || "Payment"
                })));
            } catch (error) {
                console.error("Tool getPayments failed:", error);
                return "Error retrieving payments: Database unavailable.";
            }
        },
    } as any),

    getMemberProfile: tool({
        description: "Get the current user's membership profile details (status, type, organization).",
        parameters: z.object({}),
        execute: async (_args: any) => {
            try {
                if (!userId) return "User not logged in.";

                const member = await db.query.members.findFirst({
                    where: eq(members.userId, userId),
                    with: {
                        organization: true
                    }
                });

                if (!member) return "No member profile found. You may need to complete registration.";

                return JSON.stringify({
                    memberId: member.memberId,
                    status: member.status,
                    type: member.membershipType,
                    organization: member.organization.name,
                    joined: member.dateJoined
                });
            } catch (error) {
                console.error("Tool getMemberProfile failed:", error);
                return "Error retrieving profile: Database unavailable.";
            }
        }
    } as any),

    getProgrammes: tool({
        description: "Get list of upcoming programmes, events, or campaigns.",
        parameters: z.object({}),
        execute: async (_args: any) => {
            try {
                const activeCampaigns = await db.query.fundraisingCampaigns.findMany({
                    where: eq(fundraisingCampaigns.status, "ACTIVE"),
                    limit: 5
                });

                return JSON.stringify(activeCampaigns.map(c => ({
                    title: c.title,
                    description: c.description,
                    target: c.targetAmount,
                    endDate: c.endDate
                })));
            } catch (error) {
                console.error("Tool getProgrammes failed:", error);
                return "Error retrieving programmes: Database unavailable.";
            }
        }
    } as any)
});

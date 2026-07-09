import { db } from "@/lib/db";
import { financeTransactions, payments, programmeRegistrations, programmes, organizations, users } from "@/lib/db/schema";
import { eq, inArray, isNotNull, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const secret = url.searchParams.get("secret");

        // Optional security measure
        if (secret !== "sync123") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const stats = {
            paymentsChecked: 0,
            paymentsSynced: 0,
            registrationsChecked: 0,
            registrationsSynced: 0
        };

        // Get default fallback entities
        const [nationalOrg] = await db.select().from(organizations).where(eq(organizations.level, 'NATIONAL')).limit(1);
        const [firstUser] = await db.select({ id: users.id }).from(users).orderBy(asc(users.createdAt)).limit(1);

        const fallbackOrgId = nationalOrg?.id || "";
        const fallbackUserId = firstUser?.id || "";

        if (!fallbackOrgId || !fallbackUserId) {
             return NextResponse.json({ error: "System missing default organization or user" }, { status: 500 });
        }

        // 1. Sync General Payments
        const successfulPayments = await db.select().from(payments).where(eq(payments.status, 'SUCCESS'));
        stats.paymentsChecked = successfulPayments.length;

        for (const payment of successfulPayments) {
            const reference = payment.paystackRef || payment.id;
            const [existingTx] = await db.select().from(financeTransactions)
                .where(eq(financeTransactions.metadata, reference)).limit(1);

            if (!existingTx) {
                const orgId = payment.organizationId || fallbackOrgId;
                const performerId = payment.userId || fallbackUserId;

                await db.insert(financeTransactions).values({
                    organizationId: orgId,
                    type: 'INFLOW',
                    amount: payment.amount,
                    category: payment.paymentType,
                    description: `Payment for ${payment.description || payment.paymentType} (${reference})`,
                    performedBy: performerId,
                    date: payment.paidAt || payment.createdAt || new Date(),
                    metadata: reference
                });
                stats.paymentsSynced++;
            }
        }

        // 2. Sync Programme Registrations
        const paidRegistrations = await db.select({
            reg: programmeRegistrations,
            programme: programmes
        }).from(programmeRegistrations)
        .leftJoin(programmes, eq(programmeRegistrations.programmeId, programmes.id))
        .where(isNotNull(programmeRegistrations.paymentReference));
        
        // Filter for PAID or PARTIALLY_PAID
        const validStatuses = ['PAID', 'PARTIALLY_PAID'];
        const completedRegistrations = paidRegistrations.filter(r => validStatuses.includes(r.reg.status));
        stats.registrationsChecked = completedRegistrations.length;

        for (const record of completedRegistrations) {
            const reg = record.reg;
            const prog = record.programme;
            
            // Extract original reference (remove ':verified' if present)
            let reference = reg.paymentReference || "";
            if (reference.endsWith(':verified')) {
                reference = reference.replace(':verified', '');
            }
            if (!reference) continue;

            const [existingTx] = await db.select().from(financeTransactions)
                .where(eq(financeTransactions.metadata, reference)).limit(1);

            if (!existingTx && prog && prog.organizationId) {
                const performerId = reg.userId || fallbackUserId;
                const amount = parseFloat(reg.amountPaid || "0");

                if (amount > 0) {
                    await db.insert(financeTransactions).values({
                        organizationId: prog.organizationId,
                        type: 'INFLOW',
                        amount: amount.toString(),
                        category: 'PROGRAMME_REGISTRATION',
                        description: `Registration payment for programme: ${prog.title} (${reference})`,
                        performedBy: performerId,
                        date: reg.createdAt || new Date(),
                        metadata: reference
                    });
                    stats.registrationsSynced++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: "Sync completed successfully",
            stats
        });

    } catch (error: any) {
        console.error("Sync Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

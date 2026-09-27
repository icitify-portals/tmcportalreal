"use server";

import { db } from "@/lib/db";
import {
    programmes,
    programmeRegistrations,
    bulkRegistrationGroups,
    programmeSponsorshipPools,
    users,
    payments,
    financeTransactions,
} from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/session";
import { v4 as uuidv4 } from "uuid";
import { resolvePayableTotal } from "@/lib/pricing";
import { initializePayment, verifyPayment } from "@/lib/payments";
import {
    registerForProgramme,
    getRegistrationDetails,
} from "@/lib/actions/programmes";
import {
    createBulkRegistration,
    emailBulkClaimLinks,
} from "@/lib/actions/programme-bulk";
import {
    createSponsorshipPool,
    emailSponsorCode,
} from "@/lib/actions/programme-sponsorship";

export interface TogetherAttendeeInput {
    name: string;
    email: string;
    phone?: string;
}

/**
 * Combined checkout: own registration + extra seats (named bulk group OR
 * unnamed sponsorship pool) in ONE Paystack transaction.
 * Works for logged-in members and guests. Existing single flows untouched.
 */
export async function createTogetherCheckout(data: {
    programmeId: string;
    guest?: { name: string; email: string; phone?: string };
    extraMode: "named" | "open";
    attendees?: TogetherAttendeeInput[];
    seatCount?: number;
    notes?: string;
}) {
    const session = await getServerSession();

    const [prog] = await db.select().from(programmes).where(eq(programmes.id, data.programmeId)).limit(1);
    if (!prog) return { success: false, error: "Programme not found" };
    if (prog.status !== "APPROVED") return { success: false, error: "Programme is not approved" };
    if (!prog.paymentRequired || Number(prog.amount || 0) <= 0) {
        return { success: false, error: "This programme is free — everyone can register individually at no cost" };
    }

    const payerName = session?.user?.name || data.guest?.name?.trim() || "";
    const payerEmail = session?.user?.email || data.guest?.email?.trim() || "";
    const payerPhone = (session?.user as any)?.phone || data.guest?.phone?.trim() || undefined;
    if (!payerName || !payerEmail) return { success: false, error: "Your name and email are required" };

    // 1. Ensure own registration (creates PENDING one if new; reuses existing otherwise)
    const regRes: any = await registerForProgramme(
        data.programmeId,
        session ? undefined : { name: payerName, email: payerEmail, phone: payerPhone || "", gender: "MALE", address: "", country: "Nigeria", state: "", lga: "" }
    );
    if (!regRes?.registrationId) {
        return { success: false, error: regRes?.error || "Could not create your registration" };
    }
    const registrationId: string = regRes.registrationId;

    const regDetails: any = await getRegistrationDetails(registrationId);
    if (!regDetails) return { success: false, error: "Registration not found" };
    const { total: ownTotal } = resolvePayableTotal({
        amount: regDetails.programme.amount,
        earlyBirdAmount: (regDetails.programme as any).earlyBirdAmount,
        earlyBirdDeadline: (regDetails.programme as any).earlyBirdDeadline,
        tiers: (regDetails.programme as any).tiers,
        lockedAmount: (regDetails as any).lockedAmount,
        lockedEarlyBirdDeadline: (regDetails as any).lockedEarlyBirdDeadline,
        amountPaid: regDetails.amountPaid,
    });
    const ownShare = Math.max(0, ownTotal - parseFloat(regDetails.amountPaid || "0"));

    // 2. Extras: named bulk group OR unnamed sponsorship pool
    let groupId: string | undefined;
    let poolId: string | undefined;
    let extrasTotal = 0;
    let sponsorCode: string | undefined;

    if (data.extraMode === "named") {
        const cleaned = (data.attendees || [])
            .filter((a) => a.name?.trim() && a.email?.trim())
            .slice(0, 100);
        if (cleaned.length === 0) return { success: false, error: "Add at least one extra person (name + email)" };
        const bulkRes: any = await createBulkRegistration({
            programmeId: data.programmeId,
            paymasterName: payerName,
            paymasterEmail: payerEmail,
            paymasterPhone: payerPhone,
            attendees: cleaned,
            notes: data.notes || `Together checkout with registration ${registrationId}`,
        });
        if (!bulkRes?.success) return { success: false, error: bulkRes?.error || "Could not create bulk group" };
        groupId = bulkRes.groupId;
        extrasTotal = Number(bulkRes.totalAmount || 0);
    } else {
        const seatCount = Math.floor(Number(data.seatCount));
        if (!seatCount || seatCount < 1 || seatCount > 100) {
            return { success: false, error: "Sponsored seats must be between 1 and 100 for combined checkout" };
        }
        const poolRes: any = await createSponsorshipPool({
            programmeId: data.programmeId,
            sponsorName: payerName,
            sponsorEmail: payerEmail,
            sponsorPhone: payerPhone,
            seatCount,
            notes: data.notes || `Together checkout with registration ${registrationId}`,
        });
        if (!poolRes?.success) return { success: false, error: poolRes?.error || "Could not create sponsorship" };
        poolId = poolRes.poolId;
        extrasTotal = Number(poolRes.totalAmount || 0);
        sponsorCode = poolRes.sponsorCode;
    }

    const combinedTotal = Math.round((ownShare + extrasTotal) * 100) / 100;
    if (combinedTotal <= 0) {
        // Nothing to charge (e.g. own reg already fully paid + free extras — shouldn't normally happen)
        return { success: true, free: true, registrationId, groupId, poolId, sponsorCode };
    }

    // 3. Single Paystack checkout for own balance + extras
    const params = new URLSearchParams({ reg: registrationId });
    if (groupId) params.set("group", groupId);
    if (poolId) params.set("pool", poolId);
    const res = await initializePayment({
        email: payerEmail,
        amount: combinedTotal,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL}/programmes/together/verify?${params.toString()}`,
        subaccount: (prog as any)?.paystackSubaccountCode || undefined,
        metadata: {
            type: "TOGETHER_CHECKOUT",
            registrationId,
            bulkGroupId: groupId,
            sponsorshipPoolId: poolId,
            ownShare,
            extrasShare: extrasTotal,
        },
    });
    if (res.success && (res as any).reference) {
        await db.update(programmeRegistrations).set({ paymentReference: (res as any).reference } as any).where(eq(programmeRegistrations.id, registrationId));
        if (groupId) {
            await db.update(bulkRegistrationGroups).set({ paymentRef: (res as any).reference } as any).where(eq(bulkRegistrationGroups.id, groupId));
        }
        if (poolId) {
            await db.update(programmeSponsorshipPools).set({ paymentRef: (res as any).reference } as any).where(eq(programmeSponsorshipPools.id, poolId));
        }
    }
    return { ...res, registrationId, groupId, poolId, sponsorCode, ownShare, extrasShare: extrasTotal, combinedTotal };
}

/**
 * Verify a combined checkout and fan out to own registration + group/pool.
 * Idempotent per side: already-completed sides are skipped on re-verify.
 */
export async function verifyTogetherPayment(data: { registrationId: string; groupId?: string; poolId?: string; reference: string }) {
    const res = await verifyPayment(data.reference);
    if (!res.success || (res.data as any)?.status !== "success") return { success: false, error: "Verification failed" };

    const regDetails: any = await getRegistrationDetails(data.registrationId);
    if (!regDetails) return { success: false, error: "Registration not found" };

    const { total: ownTotal } = resolvePayableTotal({
        amount: regDetails.programme.amount,
        earlyBirdAmount: (regDetails.programme as any).earlyBirdAmount,
        earlyBirdDeadline: (regDetails.programme as any).earlyBirdDeadline,
        tiers: (regDetails.programme as any).tiers,
        lockedAmount: (regDetails as any).lockedAmount,
        lockedEarlyBirdDeadline: (regDetails as any).lockedEarlyBirdDeadline,
        amountPaid: regDetails.amountPaid,
    });
    const paidAlready = parseFloat(regDetails.amountPaid || "0");
    const ownShareCharged = Math.max(0, ownTotal - paidAlready);

    const regDone = ((regDetails as any).paymentReference || "").includes(data.reference);

    let group: any = null;
    if (data.groupId) {
        [group] = await db.select().from(bulkRegistrationGroups).where(eq(bulkRegistrationGroups.id, data.groupId)).limit(1);
        if (!group) return { success: false, error: "Bulk group not found" };
    }
    let pool: any = null;
    if (data.poolId) {
        [pool] = await db.select().from(programmeSponsorshipPools).where(eq(programmeSponsorshipPools.id, data.poolId)).limit(1);
        if (!pool) return { success: false, error: "Sponsorship pool not found" };
    }
    const groupDone = !group || group.status === "PAID";
    const poolDone = !pool || pool.status === "PAID";

    if (regDone && groupDone && poolDone) {
        return { success: true, already: true, registrationId: data.registrationId, groupId: data.groupId, poolId: data.poolId, sponsorCode: pool?.sponsorCode };
    }

    const orgId = regDetails.programme.organizationId;
    const performerId =
        regDetails.userId ||
        group?.paymasterUserId ||
        pool?.sponsorUserId ||
        (await db.select({ id: users.id }).from(users).orderBy(asc(users.createdAt)).limit(1))[0]?.id ||
        "";

    // Side 1: own registration share
    if (!regDone && ownShareCharged > 0) {
        const newPaid = paidAlready + ownShareCharged;
        await db.update(programmeRegistrations).set({
            status: (newPaid >= ownTotal ? "PAID" : "PARTIALLY_PAID") as any,
            amountPaid: newPaid.toFixed(2) as any,
            paymentReference: `${data.reference}:verified`,
        } as any).where(eq(programmeRegistrations.id, data.registrationId));

        if (performerId) {
            const [existingTx] = await db.select().from(financeTransactions).where(eq(financeTransactions.metadata, data.reference)).limit(1);
            if (!existingTx) {
                await db.insert(financeTransactions).values({
                    organizationId: orgId,
                    type: "INFLOW" as any,
                    amount: ownShareCharged.toFixed(2) as any,
                    category: "PROGRAMME_REGISTRATION",
                    description: `Registration payment for programme: ${regDetails.programme.title} (${data.reference})`,
                    performedBy: performerId,
                    date: new Date(),
                    metadata: data.reference,
                } as any);
            }
        }
        try {
            const { emailTemplates, sendEmail } = await import("@/lib/email");
            await sendEmail({
                to: regDetails.email,
                ...emailTemplates.programmeRegistrationReceipt(
                    regDetails.name,
                    regDetails.programme.title,
                    newPaid,
                    data.registrationId,
                    regDetails.member?.memberId || undefined
                ),
            });
        } catch (err) {
            console.error("Failed to send programme registration email:", err);
        }
    } else if (!regDone) {
        await db.update(programmeRegistrations).set({ paymentReference: `${data.reference}:verified` } as any).where(eq(programmeRegistrations.id, data.registrationId));
    }

    // Side 2: bulk group share (mirrors verifyBulkPayment)
    if (group && !groupDone) {
        const [pay] = await db.insert(payments).values({
            id: uuidv4(),
            userId: group.paymasterUserId,
            organizationId: orgId,
            amount: Number(group.totalAmount).toFixed(2) as any,
            currency: "NGN",
            status: "SUCCESS" as any,
            paymentType: "EVENT_FEE" as any,
            paystackRef: data.reference,
            description: `Bulk registration for ${group.attendeeCount} attendees (${group.paymasterName})`,
            paidAt: new Date(),
        } as any).$returningId();

        await db.update(bulkRegistrationGroups).set({ status: "PAID" as any, paymentId: pay.id } as any).where(eq(bulkRegistrationGroups.id, group.id));
        await db.update(programmeRegistrations).set({
            status: "PAID" as any,
            paymentStatus: "SUCCESS" as any,
            amountPaid: group.amountPerAttendee as any,
        } as any).where(eq(programmeRegistrations.bulkGroupId, group.id));

        if (performerId) {
            await db.insert(financeTransactions).values({
                id: uuidv4(),
                organizationId: orgId,
                type: "INFLOW" as any,
                amount: Number(group.totalAmount).toFixed(2) as any,
                category: "PROGRAMME_BULK_REGISTRATION",
                description: `Bulk programme registration (${group.attendeeCount} attendees, ${group.paymasterName})`,
                performedBy: performerId,
                date: new Date(),
                metadata: { reference: data.reference } as any,
            } as any);
        }
    }

    // Side 3: sponsorship pool share (mirrors verifySponsorshipPayment)
    if (pool && !poolDone) {
        const [pay] = await db.insert(payments).values({
            id: uuidv4(),
            userId: pool.sponsorUserId,
            organizationId: orgId,
            amount: Number(pool.totalAmount).toFixed(2) as any,
            currency: "NGN",
            status: "SUCCESS" as any,
            paymentType: "EVENT_FEE" as any,
            paystackRef: data.reference,
            description: `Sponsorship of ${pool.seatCount} seats (${pool.sponsorName})`,
            paidAt: new Date(),
        } as any).$returningId();

        await db.update(programmeSponsorshipPools).set({ status: "PAID" as any, paymentId: pay.id } as any).where(eq(programmeSponsorshipPools.id, pool.id));

        if (performerId) {
            await db.insert(financeTransactions).values({
                id: uuidv4(),
                organizationId: orgId,
                type: "INFLOW" as any,
                amount: Number(pool.totalAmount).toFixed(2) as any,
                category: "PROGRAMME_SPONSORSHIP",
                description: `Sponsored seats (${pool.seatCount} seats, ${pool.sponsorName})`,
                performedBy: performerId,
                date: new Date(),
                metadata: { reference: data.reference } as any,
            } as any);
        }
    }

    revalidatePath(`/programmes/registrations/${data.registrationId}/slip`);
    revalidatePath("/dashboard/programmes/sponsorship");
    revalidatePath("/dashboard/programmes/bulk");

    // Notify attendees / sponsor (awaited; helpers never throw).
    // Only for sides completed in this call — already-paid sides were notified before.
    if (group && !groupDone) await emailBulkClaimLinks(group.id);
    if (pool && !poolDone) await emailSponsorCode(pool.id);

    return { success: true, registrationId: data.registrationId, groupId: data.groupId, poolId: data.poolId, sponsorCode: pool?.sponsorCode };
}

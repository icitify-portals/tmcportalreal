"use server";

import { db } from "@/lib/db";
import {
    programmes,
    programmeRegistrations,
    programmeSponsorshipPools,
    users,
    payments,
    financeTransactions,
} from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/session";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { getEffectiveAmount } from "@/lib/pricing";
import { getEarlyBirdTiers } from "@/lib/actions/programme-early-bird";
import { initializePayment, verifyPayment } from "@/lib/payments";

function genSponsorCode(): string {
    return "SP-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

/**
 * Philanthropist/sponsor pays for N unnamed seats upfront.
 * Members later self-register against the pool with the sponsor code (first-come).
 */
export async function createSponsorshipPool(data: {
    programmeId: string;
    sponsorName: string;
    sponsorEmail: string;
    sponsorPhone?: string;
    seatCount: number;
    notes?: string;
}) {
    const session = await getServerSession();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const seatCount = Math.floor(Number(data.seatCount));
    if (!seatCount || seatCount < 1) return { success: false, error: "Seat count must be at least 1" };
    if (seatCount > 500) return { success: false, error: "Max 500 seats per sponsorship" };
    if (!data.sponsorName?.trim() || !data.sponsorEmail?.trim()) {
        return { success: false, error: "Sponsor name and email are required" };
    }

    const [prog] = await db.select().from(programmes).where(eq(programmes.id, data.programmeId)).limit(1);
    if (!prog) return { success: false, error: "Programme not found" };
    if (prog.status !== "APPROVED") return { success: false, error: "Programme is not approved" };
    if (!prog.paymentRequired || Number(prog.amount || 0) <= 0) {
        return { success: false, error: "Sponsorship is only needed for paid programmes" };
    }

    const tiers = await getEarlyBirdTiers(data.programmeId);
    const perSeat = Number(
        getEffectiveAmount({
            amount: prog.amount as any,
            earlyBirdAmount: (prog as any).earlyBirdAmount,
            earlyBirdDeadline: (prog as any).earlyBirdDeadline,
            tiers,
        })
    );
    if (perSeat <= 0) return { success: false, error: "Could not determine seat price" };

    // Unique sponsor code (retry on the astronomically unlikely collision)
    let sponsorCode = genSponsorCode();
    for (let i = 0; i < 5; i++) {
        const [existing] = await db
            .select({ id: programmeSponsorshipPools.id })
            .from(programmeSponsorshipPools)
            .where(eq(programmeSponsorshipPools.sponsorCode, sponsorCode))
            .limit(1);
        if (!existing) break;
        sponsorCode = genSponsorCode();
    }

    const poolId = uuidv4();
    await db.insert(programmeSponsorshipPools).values({
        id: poolId,
        programmeId: data.programmeId,
        sponsorUserId: session.user.id,
        sponsorName: data.sponsorName.trim(),
        sponsorEmail: data.sponsorEmail.trim(),
        sponsorPhone: data.sponsorPhone?.trim() || null,
        seatCount,
        seatsClaimed: 0,
        amountPerSeat: perSeat.toFixed(2) as any,
        totalAmount: (perSeat * seatCount).toFixed(2) as any,
        currency: "NGN",
        status: "PENDING" as any,
        sponsorCode,
        notes: data.notes?.trim() || null,
    } as any);

    revalidatePath("/dashboard/programmes/sponsorship");
    return { success: true, poolId, perSeat, totalAmount: perSeat * seatCount, sponsorCode };
}

/** Initialize Paystack payment for the whole sponsored pool. */
export async function initializeSponsorshipPayment(poolId: string) {
    const session = await getServerSession();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const [pool] = await db.select().from(programmeSponsorshipPools).where(eq(programmeSponsorshipPools.id, poolId)).limit(1);
    if (!pool) return { success: false, error: "Sponsorship not found" };
    if (pool.status === "PAID") return { success: false, error: "Already paid" };
    if (pool.status === "CANCELLED") return { success: false, error: "This sponsorship was cancelled" };

    const [prog] = await db.select().from(programmes).where(eq(programmes.id, pool.programmeId)).limit(1);
    const res = await initializePayment({
        email: pool.sponsorEmail,
        amount: Number(pool.totalAmount),
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL}/dashboard/programmes/sponsorship/verify?pool=${poolId}`,
        subaccount: (prog as any)?.paystackSubaccountCode || undefined,
        metadata: { sponsorshipPoolId: poolId, type: "SPONSORSHIP_POOL" },
    });
    if (res.success && (res as any).reference) {
        await db.update(programmeSponsorshipPools).set({ paymentRef: (res as any).reference } as any).where(eq(programmeSponsorshipPools.id, poolId));
    }
    return res;
}

/** Verify Paystack callback for a sponsorship pool. */
export async function verifySponsorshipPayment(poolId: string, reference: string) {
    const res = await verifyPayment(reference);
    if (!res.success || (res.data as any)?.status !== "success") return { success: false, error: "Verification failed" };

    const amount = Number((res.data as any)?.amount ?? 0);
    const [pool] = await db.select().from(programmeSponsorshipPools).where(eq(programmeSponsorshipPools.id, poolId)).limit(1);
    if (!pool) return { success: false, error: "Sponsorship not found" };
    if (pool.status === "PAID") return { success: true, alreadyPaid: true };

    const [pay] = await db.insert(payments).values({
        id: uuidv4(),
        userId: pool.sponsorUserId,
        organizationId: pool.programmeId ? (await db.select({ id: programmes.organizationId }).from(programmes).where(eq(programmes.id, pool.programmeId)).limit(1))[0]?.id : null,
        amount: amount.toFixed(2) as any,
        currency: "NGN",
        status: "SUCCESS" as any,
        paymentType: "EVENT_FEE" as any,
        paystackRef: reference,
        description: `Sponsorship of ${pool.seatCount} seats (${pool.sponsorName})`,
        paidAt: new Date(),
    } as any).$returningId();

    await db.update(programmeSponsorshipPools).set({
        status: "PAID" as any,
        paymentId: pay.id,
    } as any).where(eq(programmeSponsorshipPools.id, poolId));

    if (pool.programmeId) {
        const [prog] = await db.select({ orgId: programmes.organizationId }).from(programmes).where(eq(programmes.id, pool.programmeId)).limit(1);
        if (prog?.orgId && pool.sponsorUserId) {
            await db.insert(financeTransactions).values({
                id: uuidv4(),
                organizationId: prog.orgId,
                type: "INFLOW" as any,
                amount: amount.toFixed(2) as any,
                category: "PROGRAMME_SPONSORSHIP",
                description: `Sponsored seats (${pool.seatCount} seats, ${pool.sponsorName})`,
                performedBy: pool.sponsorUserId,
                date: new Date(),
                metadata: { reference } as any,
            } as any);
        }
    }

    revalidatePath("/dashboard/programmes/sponsorship");
    return { success: true, sponsorCode: pool.sponsorCode };
}

/** Public: look up a pool by sponsor code (claim page). */
export async function getSponsorshipPoolByCode(code: string) {
    const normalized = (code || "").trim().toUpperCase();
    if (!normalized) return null;
    const [pool] = await db.select().from(programmeSponsorshipPools).where(eq(programmeSponsorshipPools.sponsorCode, normalized)).limit(1);
    if (!pool) return null;
    const [prog] = await db.select().from(programmes).where(eq(programmes.id, pool.programmeId)).limit(1);
    return {
        pool,
        programme: prog,
        seatsLeft: Math.max(0, pool.seatCount - (pool.seatsClaimed || 0)),
    };
}

/**
 * Member claims one sponsored seat with the sponsor code.
 * Works for logged-in members and guests (name/email supplied).
 */
export async function claimSponsoredSeat(data: {
    sponsorCode: string;
    name: string;
    email: string;
    phone?: string;
    gender?: string;
    address?: string;
    memberId?: string;
}) {
    const session = await getServerSession();

    if (!data.sponsorCode?.trim()) return { success: false, error: "Sponsor code is required" };
    if (!data.name?.trim() || !data.email?.trim()) return { success: false, error: "Name and email are required" };

    return db.transaction(async (tx) => {
        const [pool] = await tx.select().from(programmeSponsorshipPools).where(eq(programmeSponsorshipPools.sponsorCode, data.sponsorCode.trim().toUpperCase())).limit(1);
        if (!pool) return { success: false, error: "Invalid sponsor code" };
        if (pool.status !== "PAID") return { success: false, error: "This sponsorship has not been paid for yet" };
        const seatsLeft = pool.seatCount - (pool.seatsClaimed || 0);
        if (seatsLeft <= 0) return { success: false, error: "All sponsored seats have been claimed" };

        // Prevent the same email claiming twice from one pool
        const [existing] = await tx.select({ id: programmeRegistrations.id }).from(programmeRegistrations).where(
            and(
                eq(programmeRegistrations.programmeId, pool.programmeId),
                eq(programmeRegistrations.email, data.email.trim()),
            )
        ).limit(1);
        if (existing) return { success: false, error: "This email is already registered for this programme" };

        const regId = uuidv4();
        await tx.insert(programmeRegistrations).values({
            id: regId,
            programmeId: pool.programmeId,
            userId: session?.user?.id || null,
            memberId: data.memberId || null,
            name: data.name.trim(),
            email: data.email.trim(),
            phone: data.phone || null,
            gender: data.gender || null,
            address: data.address || null,
            country: "Nigeria",
            status: "PAID" as any,
            paymentStatus: "SUCCESS" as any,
            amountPaid: pool.amountPerSeat as any,
            lockedAmount: pool.amountPerSeat as any,
            sponsorPoolId: pool.id,
            registeredAt: new Date(),
        } as any);

        await tx.update(programmeSponsorshipPools).set({
            seatsClaimed: (pool.seatsClaimed || 0) + 1,
        } as any).where(eq(programmeSponsorshipPools.id, pool.id));

        return { success: true, registrationId: regId, programmeId: pool.programmeId };
    }).catch((e) => {
        console.error("Sponsored claim failed:", e);
        return { success: false, error: "Could not claim seat. Please try again." };
    });
}

/** Sponsor's own pools (dashboard list). */
export async function listMySponsorshipPools() {
    const session = await getServerSession();
    if (!session?.user?.id) return [];
    return db
        .select({ pool: programmeSponsorshipPools, programme: programmes })
        .from(programmeSponsorshipPools)
        .leftJoin(programmes, eq(programmes.id, programmeSponsorshipPools.programmeId))
        .where(eq(programmeSponsorshipPools.sponsorUserId, session.user.id))
        .orderBy(desc(programmeSponsorshipPools.createdAt));
}

/** Admin: pools for a programme + claimed attendees per pool. */
export async function listSponsorshipPools(programmeId: string) {
    const session = await getServerSession();
    if (!session?.user?.id) return [];
    return db
        .select()
        .from(programmeSponsorshipPools)
        .where(eq(programmeSponsorshipPools.programmeId, programmeId))
        .orderBy(desc(programmeSponsorshipPools.createdAt));
}

export async function listSponsoredAttendees(poolId: string) {
    return db
        .select()
        .from(programmeRegistrations)
        .where(eq(programmeRegistrations.sponsorPoolId, poolId))
        .orderBy(desc(programmeRegistrations.registeredAt));
}

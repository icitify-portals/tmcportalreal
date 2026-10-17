"use server";

import { db } from "@/lib/db";
import {
    programmes,
    programmeRegistrations,
    programmeSponsorshipPools,
    users,
    members,
    organizations,
    payments,
    financeTransactions,
} from "@/lib/db/schema";
import { and, eq, or, desc, asc, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/session";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { getEffectiveAmount } from "@/lib/pricing";
import { getEarlyBirdTiers } from "@/lib/actions/programme-early-bird";
import { initializePayment, verifyPayment, guestCreationCapHit } from "@/lib/payments";
import { sendEmail, emailTemplates } from "@/lib/email";

function genSponsorCode(): string {
    return "SP-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

function normalizeSponsorCode(raw: string): string {
    const cleaned = (raw || "").trim().toUpperCase().replace(/\s+/g, "");
    if (/^SP[0-9A-F]{8}$/.test(cleaned)) {
        return `SP-${cleaned.slice(2)}`;
    }
    return cleaned;
}

/**
 * Resolves a human-readable Membership ID (e.g. TMC/01/05/0012) or UUID, userId, or email
 * to a valid `members.id` UUID plus state/lga/branch hierarchy so FK constraints never fail.
 */
export async function resolveMemberForRegistration(
    inputMemberId?: string | null,
    userId?: string | null,
    email?: string | null
): Promise<{
    memberUuid: string | null;
    userId: string | null;
    state: string | null;
    lga: string | null;
    branch: string | null;
}> {
    try {
        const parentOrg = alias(organizations, "parent_org");
        const grandParentOrg = alias(organizations, "grandparent_org");

        const trimmedMemberInput = (inputMemberId || "").trim();
        let targetUserId = userId || null;

        if (!targetUserId && email?.trim()) {
            const [u] = await db
                .select({ id: users.id })
                .from(users)
                .where(eq(users.email, email.trim().toLowerCase()))
                .limit(1);
            if (u) targetUserId = u.id;
        }

        let memberRow: any = null;

        if (trimmedMemberInput) {
            const [byCodeOrId] = await db
                .select({
                    id: members.id,
                    userId: members.userId,
                    metadata: members.metadata,
                    orgName: organizations.name,
                    orgLevel: organizations.level,
                    orgState: organizations.state,
                    orgCity: organizations.city,
                    parentName: parentOrg.name,
                    parentLevel: parentOrg.level,
                    parentState: parentOrg.state,
                    grandParentName: grandParentOrg.name,
                    grandParentLevel: grandParentOrg.level,
                })
                .from(members)
                .leftJoin(organizations, eq(members.organizationId, organizations.id))
                .leftJoin(parentOrg, eq(organizations.parentId, parentOrg.id))
                .leftJoin(grandParentOrg, eq(parentOrg.parentId, grandParentOrg.id))
                .where(
                    or(
                        eq(members.id, trimmedMemberInput),
                        eq(members.memberId, trimmedMemberInput)
                    )
                )
                .limit(1);
            if (byCodeOrId) memberRow = byCodeOrId;
        }

        if (!memberRow && targetUserId) {
            const [byUser] = await db
                .select({
                    id: members.id,
                    userId: members.userId,
                    metadata: members.metadata,
                    orgName: organizations.name,
                    orgLevel: organizations.level,
                    orgState: organizations.state,
                    orgCity: organizations.city,
                    parentName: parentOrg.name,
                    parentLevel: parentOrg.level,
                    parentState: parentOrg.state,
                    grandParentName: grandParentOrg.name,
                    grandParentLevel: grandParentOrg.level,
                })
                .from(members)
                .leftJoin(organizations, eq(members.organizationId, organizations.id))
                .leftJoin(parentOrg, eq(organizations.parentId, parentOrg.id))
                .leftJoin(grandParentOrg, eq(parentOrg.parentId, grandParentOrg.id))
                .where(eq(members.userId, targetUserId))
                .limit(1);
            if (byUser) memberRow = byUser;
        }

        if (!memberRow) {
            return {
                memberUuid: null,
                userId: targetUserId,
                state: null,
                lga: null,
                branch: null,
            };
        }

        const meta = (memberRow.metadata || {}) as Record<string, any>;
        let state = (meta.state as string) || null;
        let lga = (meta.lga as string) || null;
        let branch = (meta.branch as string) || null;

        if (memberRow.orgLevel === "BRANCH") {
            branch = branch || memberRow.orgName || null;
            lga = lga || (memberRow.parentLevel === "LOCAL_GOVERNMENT" ? memberRow.parentName : memberRow.orgCity) || null;
            state = state || (memberRow.grandParentLevel === "STATE" ? memberRow.grandParentName : memberRow.parentState || memberRow.orgState) || null;
        } else if (memberRow.orgLevel === "LOCAL_GOVERNMENT") {
            lga = lga || memberRow.orgName || null;
            state = state || (memberRow.parentLevel === "STATE" ? memberRow.parentName : memberRow.orgState) || null;
        } else if (memberRow.orgLevel === "STATE") {
            state = state || memberRow.orgName || null;
        }

        return {
            memberUuid: memberRow.id,
            userId: targetUserId || memberRow.userId || null,
            state,
            lga,
            branch,
        };
    } catch (err) {
        console.error("resolveMemberForRegistration error:", err);
        return { memberUuid: null, userId: userId || null, state: null, lga: null, branch: null };
    }
}

/**
 * Philanthropist/sponsor pays for N seats upfront.
 * If beneficiaries array is provided, creates named registrations immediately.
 * Otherwise creates an unnamed pool (claim via code, first-come).
 */
export async function createSponsorshipPool(data: {
    programmeId: string;
    sponsorName: string;
    sponsorEmail: string;
    sponsorPhone?: string;
    seatCount: number;
    notes?: string;
    beneficiaries?: Array<{
        name: string;
        email: string;
        phone?: string;
        gender?: string;
        state?: string;
        lga?: string;
        branch?: string;
        memberId?: string;
    }>;
}) {
    const session = await getServerSession();

    const seatCount = Math.floor(Number(data.seatCount));
    if (!seatCount || seatCount < 1) return { success: false, error: "Seat count must be at least 1" };
    if (seatCount > 500) return { success: false, error: "Max 500 seats per sponsorship" };
    if (!data.sponsorName?.trim() || !data.sponsorEmail?.trim()) {
        return { success: false, error: "Sponsor name and email are required" };
    }

    // Guest (no-account) sponsors allowed — abuse-guarded by per-email daily cap
    if (!session?.user?.id) {
        if (await guestCreationCapHit(data.sponsorEmail)) {
            return { success: false, error: "Too many sponsorships from this email in the last 24 hours. Please try again tomorrow." };
        }
    }

    // Normalize contact fields
    data.sponsorName = data.sponsorName.trim();
    data.sponsorEmail = data.sponsorEmail.trim().toLowerCase();
    if (data.sponsorPhone) data.sponsorPhone = data.sponsorPhone.trim();

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
        sponsorUserId: session?.user?.id || null,
        sponsorName: data.sponsorName,
        sponsorEmail: data.sponsorEmail,
        sponsorPhone: data.sponsorPhone || null,
        seatCount,
        seatsClaimed: 0,
        amountPerSeat: perSeat.toFixed(2) as any,
        totalAmount: (perSeat * seatCount).toFixed(2) as any,
        currency: "NGN",
        status: "PENDING" as any,
        sponsorCode,
        notes: data.notes?.trim() || null,
    } as any);

    // If beneficiaries provided, create named registrations immediately
    if (data.beneficiaries && data.beneficiaries.length > 0) {
        const validBeneficiaries = data.beneficiaries.filter((b: any) => b.name?.trim());
        if (validBeneficiaries.length > seatCount) {
            return { success: false, error: `Beneficiaries (${validBeneficiaries.length}) exceed seat count (${seatCount})` };
        }
        let createdCount = 0;
        for (const b of validBeneficiaries) {
            const bEmail = (b.email?.trim() || data.sponsorEmail).toLowerCase();
            const resolved = await resolveMemberForRegistration(b.memberId, null, bEmail);

            await db.insert(programmeRegistrations).values({
                id: uuidv4(),
                programmeId: data.programmeId,
                userId: resolved.userId,
                memberId: resolved.memberUuid,
                name: b.name.trim(),
                email: bEmail,
                phone: b.phone?.trim() || null,
                gender: b.gender || null,
                address: null,
                status: "PENDING_PAYMENT" as any,
                country: "Nigeria",
                state: b.state?.trim() || resolved.state || null,
                lga: b.lga?.trim() || resolved.lga || null,
                branch: b.branch?.trim() || resolved.branch || null,
                registrationTier: null,
                amountPaid: "0.00" as any,
                lockedAmount: perSeat.toFixed(2) as any,
                sponsorPoolId: poolId,
                registeredAt: new Date(),
            } as any);
            createdCount++;
        }
        // Update pool seatsClaimed
        await db.update(programmeSponsorshipPools)
            .set({ seatsClaimed: createdCount })
            .where(eq(programmeSponsorshipPools.id, poolId));
    }

    revalidatePath("/dashboard/programmes/sponsorship");
    return { success: true, poolId, perSeat, totalAmount: perSeat * seatCount, sponsorCode };
}

/** Initialize Paystack payment for the whole sponsored pool. */
export async function initializeSponsorshipPayment(poolId: string) {
    const session = await getServerSession();
    const [pool] = await db.select().from(programmeSponsorshipPools).where(eq(programmeSponsorshipPools.id, poolId)).limit(1);
    if (!pool) return { success: false, error: "Sponsorship not found" };
    // Guest pools (no sponsorUserId) can be paid by anyone with the link;
    // member-owned pools only by their owner.
    if (pool.sponsorUserId && pool.sponsorUserId !== session?.user?.id) {
        return { success: false, error: "Only the sponsor can pay for this sponsorship" };
    }
    if (pool.status === "PAID") return { success: false, error: "Already paid" };
    if (pool.status === "CANCELLED") return { success: false, error: "This sponsorship was cancelled" };

    const [prog] = await db.select().from(programmes).where(eq(programmes.id, pool.programmeId)).limit(1);
    const res = await initializePayment({
        email: pool.sponsorEmail,
        amount: Number(pool.totalAmount),
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL}/programmes/sponsored/verify?pool=${poolId}`,
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
    if (pool.status === "PAID") {
        // Ensure any pre-created beneficiary registrations are also marked PAID
        await db.update(programmeRegistrations).set({
            status: "PAID" as any,
            amountPaid: pool.amountPerSeat as any,
        } as any).where(eq(programmeRegistrations.sponsorPoolId, poolId));
        return { success: true, alreadyPaid: true, sponsorCode: pool.sponsorCode };
    }

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
        paymentRef: reference,
        paymentId: pay.id,
    } as any).where(eq(programmeSponsorshipPools.id, poolId));

    // Activate any pre-created named beneficiary rows in this sponsorship pool
    await db.update(programmeRegistrations).set({
        status: "PAID" as any,
        amountPaid: pool.amountPerSeat as any,
    } as any).where(eq(programmeRegistrations.sponsorPoolId, poolId));

    if (pool.programmeId) {
        const [prog] = await db.select({ orgId: programmes.organizationId }).from(programmes).where(eq(programmes.id, pool.programmeId)).limit(1);
        // Performer falls back to first user for guest sponsors (keeps finance rollups complete)
        let performerId = pool.sponsorUserId;
        if (!performerId) {
            const [firstUser] = await db.select({ id: users.id }).from(users).orderBy(asc(users.createdAt)).limit(1);
            performerId = firstUser?.id || null;
        }
        if (prog?.orgId && performerId) {
            await db.insert(financeTransactions).values({
                id: uuidv4(),
                organizationId: prog.orgId,
                type: "INFLOW" as any,
                amount: amount.toFixed(2) as any,
                category: "PROGRAMME_SPONSORSHIP",
                description: `Sponsored seats (${pool.seatCount} seats, ${pool.sponsorName})`,
                performedBy: performerId,
                date: new Date(),
                metadata: { reference } as any,
            } as any);
        }
    }

    // Notify the sponsor with their code (awaited; helper never throws)
    await emailSponsorCode(poolId);

    try {
        revalidatePath("/dashboard/programmes/sponsorship");
    } catch {
        // Ignore revalidatePath errors when called during Server Component render
    }
    return { success: true, sponsorCode: pool.sponsorCode };
}

/**
 * Email the sponsor their code + claim page link (best-effort, never throws).
 * Called after a pool is paid (standalone or together checkout).
 */
export async function emailSponsorCode(poolId: string) {
    try {
        const [pool] = await db.select().from(programmeSponsorshipPools).where(eq(programmeSponsorshipPools.id, poolId)).limit(1);
        if (!pool || !pool.sponsorEmail) return;
        const [prog] = await db.select().from(programmes).where(eq(programmes.id, pool.programmeId)).limit(1);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "";
        if (!baseUrl) return;
        const template = emailTemplates.sponsorshipCode(
            pool.sponsorName || "Sponsor",
            prog?.title || "Programme",
            pool.seatCount,
            pool.sponsorCode,
            `${baseUrl}/programmes/sponsored/claim?code=${pool.sponsorCode}`
        );
        await sendEmail({ to: pool.sponsorEmail, subject: template.subject, html: template.html, text: template.text, template: "sponsorship_code" });
    } catch (err) {
        console.error("emailSponsorCode failed:", err);
    }
}

/** Public: look up a pool by sponsor code (claim page). Self-heals if paymentRef succeeded on Paystack. */
export async function getSponsorshipPoolByCode(code: string) {
    const normalized = normalizeSponsorCode(code);
    if (!normalized) return null;
    let [pool] = await db.select().from(programmeSponsorshipPools).where(eq(programmeSponsorshipPools.sponsorCode, normalized)).limit(1);
    if (!pool) return null;

    // Self-healing: if pool is still marked PENDING but has a paymentRef, attempt Paystack verification
    if (pool.status === "PENDING" && pool.paymentRef) {
        const verifyRes = await verifySponsorshipPayment(pool.id, pool.paymentRef);
        if (verifyRes.success) {
            const [updated] = await db.select().from(programmeSponsorshipPools).where(eq(programmeSponsorshipPools.id, pool.id)).limit(1);
            if (updated) pool = updated;
        }
    }

    const [prog] = await db.select().from(programmes).where(eq(programmes.id, pool.programmeId)).limit(1);
    return {
        pool,
        programme: prog,
        seatsLeft: Math.max(0, pool.seatCount - (pool.seatsClaimed || 0)),
    };
}

/** Look up a sponsorship pool by ID along with its programme and claimed attendees. */
export async function getSponsorshipPoolById(poolId: string) {
    if (!poolId) return null;
    let [pool] = await db.select().from(programmeSponsorshipPools).where(eq(programmeSponsorshipPools.id, poolId)).limit(1);
    if (!pool) return null;

    if (pool.status === "PENDING" && pool.paymentRef) {
        const verifyRes = await verifySponsorshipPayment(pool.id, pool.paymentRef);
        if (verifyRes.success) {
            const [updated] = await db.select().from(programmeSponsorshipPools).where(eq(programmeSponsorshipPools.id, pool.id)).limit(1);
            if (updated) pool = updated;
        }
    }

    const [prog] = await db.select().from(programmes).where(eq(programmes.id, pool.programmeId)).limit(1);
    const attendees = await db
        .select()
        .from(programmeRegistrations)
        .where(eq(programmeRegistrations.sponsorPoolId, poolId))
        .orderBy(desc(programmeRegistrations.registeredAt));

    return {
        pool,
        programme: prog,
        attendees,
        seatsLeft: Math.max(0, pool.seatCount - (pool.seatsClaimed || 0)),
    };
}

/**
 * Member claims one sponsored seat with the sponsor code.
 * Works for logged-in members, guests, and coordinators claiming for indigent members.
 */
export async function claimSponsoredSeat(data: {
    sponsorCode: string;
    name: string;
    email?: string;
    phone?: string;
    gender?: string;
    address?: string;
    memberId?: string;
    country?: string;
    state?: string;
    lga?: string;
    branch?: string;
}) {
    const session = await getServerSession();
    const normalizedCode = normalizeSponsorCode(data.sponsorCode);

    if (!normalizedCode) return { success: false, error: "Sponsor code is required" };
    if (!data.name?.trim()) return { success: false, error: "Full name is required" };

    // Pre-check & self-heal pool payment status outside transaction if needed
    const [initialPool] = await db
        .select()
        .from(programmeSponsorshipPools)
        .where(eq(programmeSponsorshipPools.sponsorCode, normalizedCode))
        .limit(1);
    if (!initialPool) return { success: false, error: "Invalid sponsor code" };

    if (initialPool.status === "PENDING" && initialPool.paymentRef) {
        await verifySponsorshipPayment(initialPool.id, initialPool.paymentRef);
    }

    const claimEmail = (data.email?.trim() || session?.user?.email || initialPool.sponsorEmail || "").toLowerCase();
    if (!claimEmail) return { success: false, error: "Email address is required" };

    // Safely resolve human-readable TMC Membership ID (e.g. TMC/01/...) to UUID `members.id`
    const resolvedMember = await resolveMemberForRegistration(data.memberId, session?.user?.id, claimEmail);

    return db.transaction(async (tx) => {
        const [pool] = await tx
            .select()
            .from(programmeSponsorshipPools)
            .where(eq(programmeSponsorshipPools.sponsorCode, normalizedCode))
            .limit(1);
        if (!pool) return { success: false, error: "Invalid sponsor code" };
        if (pool.status !== "PAID") return { success: false, error: "This sponsorship has not been paid for yet" };
        const seatsLeft = pool.seatCount - (pool.seatsClaimed || 0);
        if (seatsLeft <= 0) return { success: false, error: "All sponsored seats have been claimed" };

        const normalizedName = data.name.trim().toLowerCase().replace(/\s+/g, " ");

        // Check existing registrations for this programme and email
        const existingRows = await tx
            .select()
            .from(programmeRegistrations)
            .where(
                and(
                    eq(programmeRegistrations.programmeId, pool.programmeId),
                    eq(programmeRegistrations.email, claimEmail)
                )
            );

        // 1. Check if the exact same person is already paid/sponsored
        const samePersonPaid = existingRows.find((r) => {
            const rName = (r.name || "").trim().toLowerCase().replace(/\s+/g, " ");
            const isPaid = r.status === "PAID" || r.status === "ATTENDED" || Number(r.amountPaid || 0) >= Number(pool.amountPerSeat || 0);
            return rName === normalizedName && isPaid;
        });
        if (samePersonPaid) {
            return { success: false, error: `${data.name.trim()} is already registered and paid for this programme.` };
        }

        // 2. Check if there is an unpaid PENDING_PAYMENT registration for this person (or single unpaid registration on this personal email) that should be upgraded into this sponsored seat
        const unpaidToUpgrade = existingRows.find((r) => {
            const rName = (r.name || "").trim().toLowerCase().replace(/\s+/g, " ");
            const isUnpaid = r.status === "PENDING_PAYMENT" && Number(r.amountPaid || 0) === 0 && !r.sponsorPoolId && !r.bulkGroupId;
            return isUnpaid && (rName === normalizedName || (existingRows.length === 1 && claimEmail !== pool.sponsorEmail.toLowerCase()));
        });

        let regId = uuidv4();

        if (unpaidToUpgrade) {
            regId = unpaidToUpgrade.id;
            await tx.update(programmeRegistrations).set({
                userId: unpaidToUpgrade.userId || resolvedMember.userId || session?.user?.id || null,
                memberId: unpaidToUpgrade.memberId || resolvedMember.memberUuid || null,
                name: data.name.trim(),
                email: claimEmail,
                phone: data.phone?.trim() || unpaidToUpgrade.phone || null,
                gender: data.gender || unpaidToUpgrade.gender || null,
                address: data.address?.trim() || unpaidToUpgrade.address || null,
                country: data.country?.trim() || unpaidToUpgrade.country || "Nigeria",
                state: data.state?.trim() || unpaidToUpgrade.state || resolvedMember.state || null,
                lga: data.lga?.trim() || unpaidToUpgrade.lga || resolvedMember.lga || null,
                branch: data.branch?.trim() || unpaidToUpgrade.branch || resolvedMember.branch || null,
                status: "PAID" as any,
                amountPaid: pool.amountPerSeat as any,
                lockedAmount: pool.amountPerSeat as any,
                sponsorPoolId: pool.id,
            } as any).where(eq(programmeRegistrations.id, regId));
        } else {
            await tx.insert(programmeRegistrations).values({
                id: regId,
                programmeId: pool.programmeId,
                userId: resolvedMember.userId || (claimEmail === session?.user?.email?.toLowerCase() ? session?.user?.id : null) || null,
                memberId: resolvedMember.memberUuid || null,
                name: data.name.trim(),
                email: claimEmail,
                phone: data.phone?.trim() || null,
                gender: data.gender || null,
                address: data.address?.trim() || null,
                country: data.country?.trim() || "Nigeria",
                state: data.state?.trim() || resolvedMember.state || null,
                lga: data.lga?.trim() || resolvedMember.lga || resolvedMember.lga || null,
                branch: data.branch?.trim() || resolvedMember.branch || null,
                status: "PAID" as any,
                amountPaid: pool.amountPerSeat as any,
                lockedAmount: pool.amountPerSeat as any,
                sponsorPoolId: pool.id,
                registeredAt: new Date(),
            } as any);
        }

        await tx.update(programmeSponsorshipPools).set({
            seatsClaimed: (pool.seatsClaimed || 0) + 1,
        } as any).where(eq(programmeSponsorshipPools.id, pool.id));

        return { success: true, registrationId: regId, programmeId: pool.programmeId };
    }).catch((e) => {
        console.error("Sponsored claim failed:", e);
        return { success: false, error: e?.message || "Could not claim seat. Please try again." };
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

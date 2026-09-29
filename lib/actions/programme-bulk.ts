"use server";

import { db } from "@/lib/db";
import {
    programmes,
    programmeRegistrations,
    bulkRegistrationGroups,
    users,
    payments,
    financeTransactions,
} from "@/lib/db/schema";
import { and, eq, desc, asc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/session";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { getEffectiveAmount, getActiveEarlyBird } from "@/lib/pricing";
import { getEarlyBirdTiers } from "@/lib/actions/programme-early-bird";
import { initializePayment, verifyPayment, guestCreationCapHit } from "@/lib/payments";
import { sendEmail, emailTemplates } from "@/lib/email";

function genToken(): string {
    return crypto.randomBytes(24).toString("base64url");
}

export interface BulkAttendeeInput {
    name: string;
    email: string;
    phone?: string;
    category?: string;
    memberId?: string;
    gender?: string;
    address?: string;
    state?: string;
    lga?: string;
    branch?: string;
}

/**
 * Create a bulk registration group + a PENDING registration row per attendee.
 * Each registration gets its own claim token for the attendee to complete profile later.
 * The group's payment is initialized separately (initializeBulkPayment).
 */
export async function createBulkRegistration(data: {
    programmeId: string;
    paymasterName: string;
    paymasterEmail: string;
    paymasterPhone?: string;
    attendees: BulkAttendeeInput[];
    notes?: string;
}) {
    const session = await getServerSession();

    if (!data.attendees?.length || data.attendees.length < 1)
        return { success: false, error: "Add at least one attendee" };
    if (data.attendees.length > 500)
        return { success: false, error: "Max 500 attendees per bulk" };
    if (!data.paymasterName?.trim() || !data.paymasterEmail?.trim())
        return { success: false, error: "Paymaster name and email are required" };

    // Guest (no-account) paymasters allowed — abuse-guarded by per-email daily cap
    if (!session?.user?.id) {
        if (await guestCreationCapHit(data.paymasterEmail)) {
            return { success: false, error: "Too many bulk registrations from this email in the last 24 hours. Please try again tomorrow." };
        }
    }

    // Normalize contact fields (email gate on the public manage page depends on exact match)
    data.paymasterName = data.paymasterName.trim();
    data.paymasterEmail = data.paymasterEmail.trim().toLowerCase();
    if (data.paymasterPhone) data.paymasterPhone = data.paymasterPhone.trim();

    // Validate programme
    const [prog] = await db.select().from(programmes).where(eq(programmes.id, data.programmeId)).limit(1);
    if (!prog) return { success: false, error: "Programme not found" };
    if (prog.status !== "APPROVED")
        return { success: false, error: "Programme is not approved" };

    const bulkTiers = await getEarlyBirdTiers(data.programmeId);
    const bulkEbFields = {
        amount: prog.amount as any,
        earlyBirdAmount: (prog as any).earlyBirdAmount,
        earlyBirdDeadline: (prog as any).earlyBirdDeadline,
        tiers: bulkTiers,
    };
    const effectivePerAttendee = prog.paymentRequired
        ? Number(getEffectiveAmount(bulkEbFields))
        : 0;
    // EB window the bulk price was locked in (null when normal price) — informational for now
    const bulkAppliedEb = getActiveEarlyBird(bulkEbFields);
    const bulkLockedEbDeadline = bulkAppliedEb && bulkAppliedEb.amount < Number(prog.amount || 0) ? bulkAppliedEb.deadline : null;

    const totalAmount = effectivePerAttendee * data.attendees.length;
    const groupId = uuidv4();

    await db.insert(bulkRegistrationGroups).values({
        id: groupId,
        programmeId: data.programmeId,
        paymasterUserId: session?.user?.id || null,
        paymasterName: data.paymasterName,
        paymasterEmail: data.paymasterEmail,
        paymasterPhone: data.paymasterPhone || null,
        attendeeCount: data.attendees.length,
        amountPerAttendee: effectivePerAttendee.toFixed(2) as any,
        totalAmount: totalAmount.toFixed(2) as any,
        currency: "NGN",
        status: "PENDING" as any,
        notes: data.notes || null,
    } as any);

    // Create a registration per attendee (no pay yet — payment happens at group level)
    const registrationIds: string[] = [];
    for (const a of data.attendees) {
        if (!a.name?.trim() || !a.email?.trim()) continue;
        const regId = uuidv4();
        const token = genToken();
        await db.insert(programmeRegistrations).values({
            id: regId,
            programmeId: data.programmeId,
            memberId: a.memberId?.trim() || null,
            name: a.name.trim(),
            email: a.email.trim(),
            phone: a.phone?.trim() || null,
            gender: a.gender?.trim() || null,
            address: a.address?.trim() || null,
            country: "Nigeria",
            state: a.state?.trim() || null,
            lga: a.lga?.trim() || null,
            branch: a.branch?.trim() || null,
            status: prog.paymentRequired ? "PENDING_PAYMENT" : "REGISTERED",
            amountPaid: (prog.paymentRequired ? "0.00" : effectivePerAttendee.toFixed(2)) as any,
            paymentStatus: (prog.paymentRequired ? "PENDING" : "SUCCESS") as any,
            bulkGroupId: groupId,
            bulkClaimToken: token,
            bulkClaimedAt: null,
            lockedAmount: (prog.paymentRequired ? effectivePerAttendee.toFixed(2) : null) as any,
            lockedEarlyBirdDeadline: bulkLockedEbDeadline as any,
        } as any);
        registrationIds.push(regId);
    }

    revalidatePath(`/programmes/registrations/${data.programmeId}/bulk`);
    return {
        success: true,
        groupId,
        registrationIds,
        perAttendee: effectivePerAttendee,
        totalAmount,
        paymentRequired: !!prog.paymentRequired,
    };
}

/**
 * Initialize Paystack payment for the whole bulk group (total = perAttendee * attendeeCount).
 */
export async function initializeBulkPayment(groupId: string) {
    const session = await getServerSession();
    const [group] = await db.select().from(bulkRegistrationGroups).where(eq(bulkRegistrationGroups.id, groupId)).limit(1);
    if (!group) return { success: false, error: "Group not found" };
    // Guest groups (no paymasterUserId) can be paid by anyone with the link (paying is harmless);
    // member-owned groups can only be paid by their owner (or any official flow already authorized).
    if (group.paymasterUserId && group.paymasterUserId !== session?.user?.id) {
        return { success: false, error: "Only the paymaster can pay for this group" };
    }
    if (group.status === "PAID") return { success: false, error: "Already paid" };
    if (Number(group.totalAmount) <= 0) {
        // Free event — mark paid directly, no payment needed
        await db.update(bulkRegistrationGroups).set({ status: "PAID" as any } as any).where(eq(bulkRegistrationGroups.id, groupId));
        return { success: true, free: true };
    }

    const [prog] = await db.select().from(programmes).where(eq(programmes.id, group.programmeId)).limit(1);
    const res = await initializePayment({
        email: group.paymasterEmail,
        amount: Number(group.totalAmount),
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL}/programmes/bulk/verify?group=${groupId}`,
        subaccount: (prog as any)?.paystackSubaccountCode || undefined,
        metadata: { bulkGroupId: groupId, type: "BULK_REGISTRATION_FEE" },
    });
    if (res.success && (res as any).reference) {
        await db.update(bulkRegistrationGroups).set({ paymentRef: (res as any).reference } as any).where(eq(bulkRegistrationGroups.id, groupId));
    }
    return res;
}

/**
 * Verify Paystack callback for a bulk group, mark group paid + each registration PAID.
 */
export async function verifyBulkPayment(groupId: string, reference: string) {
    const res = await verifyPayment(reference);
    if (!res.success || (res.data as any)?.status !== "success") return { success: false, error: "Verification failed" };

    const amount = Number((res.data as any)?.amount ?? 0);
    const [group] = await db.select().from(bulkRegistrationGroups).where(eq(bulkRegistrationGroups.id, groupId)).limit(1);
    if (!group) return { success: false, error: "Group not found" };

    // Insert payment record
    const [pay] = await db.insert(payments).values({
        id: uuidv4(),
        userId: group.paymasterUserId,
        organizationId: group.programmeId ? (await db.select({ id: programmes.organizationId }).from(programmes).where(eq(programmes.id, group.programmeId)).limit(1))[0]?.id : null,
        amount: amount.toFixed(2) as any,
        currency: "NGN",
        status: "SUCCESS" as any,
        paymentType: "EVENT_FEE" as any,
        paystackRef: reference,
        description: `Bulk registration for ${group.attendeeCount} attendees (${group.paymasterName})`,
        paidAt: new Date(),
    } as any).$returningId();

    await db.update(bulkRegistrationGroups).set({
        status: "PAID" as any,
        paymentId: pay.id,
    } as any).where(eq(bulkRegistrationGroups.id, groupId));

    // Mark each registration in this group as PAID with locked amount
    await db.update(programmeRegistrations).set({
        status: "PAID" as any,
        paymentStatus: "SUCCESS" as any,
        amountPaid: group.amountPerAttendee as any,
    } as any).where(eq(programmeRegistrations.bulkGroupId, groupId));

    // Finance inflow (performer falls back to first user for guest paymasters)
    if (group.programmeId) {
        const [prog] = await db.select({ orgId: programmes.organizationId }).from(programmes).where(eq(programmes.id, group.programmeId)).limit(1);
        let performerId = group.paymasterUserId;
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
                category: "PROGRAMME_BULK_REGISTRATION",
                description: `Bulk programme registration (${group.attendeeCount} attendees, ${group.paymasterName})`,
                performedBy: performerId,
                date: new Date(),
                metadata: { reference } as any,
            } as any);
        }
    }

    // Notify every attendee with their personal claim link (awaited; helper never throws)
    await emailBulkClaimLinks(groupId);

    revalidatePath(`/dashboard/programmes/bulk`);
    return { success: true };
}

/**
 * Claim a bulk-registration seat by token (the attendee visits their link).
 * Lets the attendee (or logged-in member) complete their profile & confirm the seat.
 */
export async function claimBulkSeat(data: {
    token: string;
    name?: string;
    email?: string;
    phone?: string;
    gender?: string;
    address?: string;
    memberId?: string;
    state?: string;
    lga?: string;
}) {
    if (!data.token) return { success: false, error: "Invalid link" };

    const [reg] = await db.select().from(programmeRegistrations).where(eq(programmeRegistrations.bulkClaimToken, data.token)).limit(1);
    if (!reg) return { success: false, error: "Link not found or already used" };
    if (reg.bulkClaimedAt) return { success: false, error: "Already claimed" };

    // Link the claim to the logged-in member account when available (fixes "Guest" display)
    const session = await getServerSession();

    await db.update(programmeRegistrations).set({
        userId: reg.userId || session?.user?.id || null,
        memberId: data.memberId?.trim() || reg.memberId,
        name: data.name?.trim() || reg.name,
        email: data.email?.trim() || reg.email,
        phone: data.phone?.trim() || reg.phone,
        gender: data.gender?.trim() || reg.gender,
        address: data.address?.trim() || reg.address,
        state: data.state?.trim() || reg.state,
        lga: data.lga?.trim() || reg.lga,
        bulkClaimedAt: new Date(),
    } as any).where(eq(programmeRegistrations.id, reg.id));

    return { success: true, programmeId: reg.programmeId, name: reg.name };
}

/**
 * Email every attendee their personal claim link (best-effort, never throws).
 * Called after a bulk group is paid (standalone or together checkout).
 */
export async function emailBulkClaimLinks(groupId: string) {
    try {
        const [group] = await db.select().from(bulkRegistrationGroups).where(eq(bulkRegistrationGroups.id, groupId)).limit(1);
        if (!group) return;
        const [prog] = await db.select().from(programmes).where(eq(programmes.id, group.programmeId)).limit(1);
        const attendees = await listBulkAttendees(groupId);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "";
        if (!baseUrl) return;
        await Promise.all(attendees.map((a: any) => {
            if (!a.email || !a.bulkClaimToken) return Promise.resolve();
            const template = emailTemplates.bulkSeatClaim(
                a.name || "Participant",
                prog?.title || "Programme",
                `${baseUrl}/programmes/bulk/claim?token=${a.bulkClaimToken}`,
                group.paymasterName || "Your sponsor"
            );
            return sendEmail({ to: a.email, subject: template.subject, html: template.html, text: template.text, template: "bulk_seat_claim" });
        })).catch((err) => console.error("Error sending bulk claim emails:", err));
    } catch (err) {
        console.error("emailBulkClaimLinks failed:", err);
    }
}

/**
 * Paymaster completes/corrects one attendee seat in their own group.
 * Auth: session owner of the group, OR matching paymaster email (public manage flow).
 * Attendee claim links keep working (token is per-row, not email-bound).
 * Completing a seat marks it claimed so attendees aren't nagged afterwards.
 */
export async function updateBulkAttendee(data: {
    registrationId: string;
    paymasterEmail?: string;
    name: string;
    email: string;
    phone?: string;
    gender?: string;
    address?: string;
    memberId?: string;
    state?: string;
    lga?: string;
}) {
    const session = await getServerSession();

    if (!data.registrationId) return { success: false, error: "Registration not found" };
    if (!data.name?.trim() || !data.email?.trim()) return { success: false, error: "Name and email are required" };

    const [reg] = await db.select().from(programmeRegistrations).where(eq(programmeRegistrations.id, data.registrationId)).limit(1);
    if (!reg || !reg.bulkGroupId) return { success: false, error: "Not a bulk seat" };

    const [group] = await db.select().from(bulkRegistrationGroups).where(eq(bulkRegistrationGroups.id, reg.bulkGroupId)).limit(1);
    if (!group) return { success: false, error: "Group not found" };

    const isOwner = !!session?.user?.id && group.paymasterUserId === session.user.id;
    const emailMatch = !!data.paymasterEmail?.trim() && (group.paymasterEmail || "").toLowerCase() === data.paymasterEmail.trim().toLowerCase();
    if (!isOwner && !emailMatch) {
        return { success: false, error: "Only the paymaster can edit this seat" };
    }

    await db.update(programmeRegistrations).set({
        userId: reg.userId || session?.user?.id || null,
        memberId: data.memberId?.trim() || reg.memberId,
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || null,
        gender: data.gender?.trim() || reg.gender,
        address: data.address?.trim() || null,
        state: data.state?.trim() || reg.state,
        lga: data.lga?.trim() || reg.lga,
        bulkClaimedAt: reg.bulkClaimedAt || new Date(),
    } as any).where(eq(programmeRegistrations.id, reg.id));

    revalidatePath("/dashboard/programmes/bulk");
    return { success: true };
}

/**
 * Public manage view for (guest) paymasters: group + attendees iff the
 * supplied email matches the paymaster email (case-insensitive).
 */
export async function getBulkGroupForManager(groupId: string, email: string) {
    if (!groupId || !email?.trim()) return { success: false as const, error: "Group and email are required" };
    const [group] = await db.select().from(bulkRegistrationGroups).where(eq(bulkRegistrationGroups.id, groupId)).limit(1);
    if (!group) return { success: false as const, error: "Group not found" };
    if ((group.paymasterEmail || "").toLowerCase() !== email.trim().toLowerCase()) {
        return { success: false as const, error: "Email does not match this group's paymaster" };
    }
    const [prog] = await db.select().from(programmes).where(eq(programmes.id, group.programmeId)).limit(1);
    const attendees = await listBulkAttendees(groupId);
    return { success: true as const, group, programme: prog, attendees };
}

/**
 * Admin: list bulk groups for a programme.
 */
export async function listBulkGroups(programmeId: string) {
    const session = await getServerSession();
    if (!session?.user?.id) return [];
    return db
        .select({
            group: bulkRegistrationGroups,
            paymaster: users,
        })
        .from(bulkRegistrationGroups)
        .leftJoin(users, eq(users.id, bulkRegistrationGroups.paymasterUserId))
        .where(eq(bulkRegistrationGroups.programmeId, programmeId))
        .orderBy(desc(bulkRegistrationGroups.createdAt));
}

/**
 * Admin: list attendees in a bulk group.
 */
export async function listBulkAttendees(groupId: string) {
    return db
        .select()
        .from(programmeRegistrations)
        .where(eq(programmeRegistrations.bulkGroupId, groupId))
        .orderBy(asc(programmeRegistrations.name));
}

/**
 * Public: get bulk info from a claim token (used by attendee claim page).
 */
export async function getBulkSeatByToken(token: string) {
    const [reg] = await db.select().from(programmeRegistrations).where(eq(programmeRegistrations.bulkClaimToken, token)).limit(1);
    if (!reg) return null;
    const [prog] = await db.select().from(programmes).where(eq(programmes.id, reg.programmeId)).limit(1);
    return { registration: reg, programme: prog };
}

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
import { getEffectiveAmount } from "@/lib/pricing";
import { initializePayment, verifyPayment } from "@/lib/payments";

function genToken(): string {
    return crypto.randomBytes(24).toString("base64url");
}

export interface BulkAttendeeInput {
    name: string;
    email: string;
    phone?: string;
    category?: string;
    memberId?: string;
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
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    if (!data.attendees?.length || data.attendees.length < 1)
        return { success: false, error: "Add at least one attendee" };
    if (data.attendees.length > 500)
        return { success: false, error: "Max 500 attendees per bulk" };

    // Validate programme
    const [prog] = await db.select().from(programmes).where(eq(programmes.id, data.programmeId)).limit(1);
    if (!prog) return { success: false, error: "Programme not found" };
    if (prog.status !== "APPROVED")
        return { success: false, error: "Programme is not approved" };

    const effectivePerAttendee = prog.paymentRequired
        ? Number(getEffectiveAmount({
            amount: prog.amount as any,
            earlyBirdAmount: (prog as any).earlyBirdAmount,
            earlyBirdDeadline: (prog as any).earlyBirdDeadline,
        }))
        : 0;

    const totalAmount = effectivePerAttendee * data.attendees.length;
    const groupId = uuidv4();

    await db.insert(bulkRegistrationGroups).values({
        id: groupId,
        programmeId: data.programmeId,
        paymasterUserId: session.user.id,
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
            name: a.name.trim(),
            email: a.email.trim(),
            phone: a.phone || null,
            gender: null,
            address: null,
            status: prog.paymentRequired ? "PENDING_PAYMENT" : "REGISTERED",
            country: "Nigeria",
            amountPaid: prog.paymentRequired ? "0.00" : effectivePerAttendee.toFixed(2) as any,
            paymentStatus: prog.paymentRequired ? "PENDING" as any : "SUCCESS" as any,
            bulkGroupId: groupId,
            bulkClaimToken: token,
            bulkClaimedAt: null,
            lockedAmount: prog.paymentRequired ? effectivePerAttendee.toFixed(2) as any : null,
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
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const [group] = await db.select().from(bulkRegistrationGroups).where(eq(bulkRegistrationGroups.id, groupId)).limit(1);
    if (!group) return { success: false, error: "Group not found" };
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
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL}/dashboard/programmes/bulk/verify?group=${groupId}`,
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

    // Finance inflow
    if (group.programmeId) {
        const [prog] = await db.select({ orgId: programmes.organizationId }).from(programmes).where(eq(programmes.id, group.programmeId)).limit(1);
        if (prog?.orgId && group.paymasterUserId) {
            await db.insert(financeTransactions).values({
                id: uuidv4(),
                organizationId: prog.orgId,
                type: "INFLOW" as any,
                amount: amount.toFixed(2) as any,
                category: "PROGRAMME_BULK_REGISTRATION",
                description: `Bulk programme registration (${group.attendeeCount} attendees, ${group.paymasterName})`,
                performedBy: group.paymasterUserId,
                date: new Date(),
                metadata: { reference } as any,
            } as any);
        }
    }

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
}) {
    if (!data.token) return { success: false, error: "Invalid link" };

    const [reg] = await db.select().from(programmeRegistrations).where(eq(programmeRegistrations.bulkClaimToken, data.token)).limit(1);
    if (!reg) return { success: false, error: "Link not found or already used" };
    if (reg.bulkClaimedAt) return { success: false, error: "Already claimed" };

    await db.update(programmeRegistrations).set({
        name: data.name?.trim() || reg.name,
        email: data.email?.trim() || reg.email,
        phone: data.phone || reg.phone,
        gender: data.gender || reg.gender,
        address: data.address || reg.address,
        bulkClaimedAt: new Date(),
    } as any).where(eq(programmeRegistrations.id, reg.id));

    return { success: true, programmeId: reg.programmeId, name: reg.name };
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

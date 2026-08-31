"use server";

import { db } from "@/lib/db";
import {
  contestEvents,
  contestPhases,
  contestRepresentatives,
  contestTimetable,
  contestCalls,
  contestScores,
  contestResults,
  contestWritten,
  contestPayments,
  organizations,
  users,
  officials,
  meetings,
  payments,
  financeTransactions,
  notifications,
} from "@/lib/db/schema";
import { eq, and, desc, asc, inArray, sql, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerSession } from "@/lib/session";
import { v4 as uuidv4 } from "uuid";
import { RRule } from "rrule";
import { getEffectiveAmount } from "@/lib/pricing";
import { initializePayment, verifyPayment } from "@/lib/payments";
import { sendEmail } from "@/lib/email";

const ContestSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(["QURAN", "DEBATE", "WRITTEN", "OTHER"]),
  format: z.enum(["PHYSICAL", "VIRTUAL", "HYBRID"]).default("PHYSICAL"),
  year: z.coerce.number().int(),
  level: z.enum(["NATIONAL", "STATE", "LOCAL_GOVERNMENT", "BRANCH"]),
  rruleString: z.string().optional().nullable(),
  targetAudience: z.enum(["PUBLIC", "MEMBERS", "BROTHERS", "SISTERS", "CHILDREN", "YOUTH", "ELDERS"]).default("PUBLIC"),
  paymentRequired: z.boolean().default(false),
  amount: z.coerce.number().default(0),
  earlyBirdAmount: z.preprocess((v) => (v === "" || v == null ? null : Number(String(v).replace(/,/g, ""))), z.number().nullable().optional()),
  earlyBirdDeadline: z.preprocess((v) => (!v ? null : new Date(v as string)), z.date().nullable().optional()),
  allowInstallments: z.boolean().default(false),
  minInstallmentAmount: z.coerce.number().default(0),
  hasCertificate: z.boolean().default(false),
});

export async function createContest(data: z.infer<typeof ContestSchema>, organizationId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  const parsed = ContestSchema.parse(data);
  let orgId = organizationId;
  let [org] = orgId ? await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1) : [null as any];
  if (!org) {
    // Fallback to creator's organization (official org or first userRole)
    const fallbackId = (session.user as any).officialOrganizationId || (session.user as any).organizationId;
    if (fallbackId) {
      const [fb] = await db.select().from(organizations).where(eq(organizations.id, fallbackId)).limit(1);
      if (fb) { org = fb; orgId = fb.id; }
    }
  }
  if (!org) {
    const [nat] = await db.select().from(organizations).where(eq(organizations.level, "NATIONAL" as any)).limit(1);
    if (nat) { org = nat; orgId = nat.id; }
  }
  if (!org) return { success: false, error: "Organization not found" };
  const contestId = uuidv4();
  const seriesId = uuidv4();
  await db.insert(contestEvents).values({
    id: contestId,
    organizationId: orgId,
    title: parsed.title,
    description: parsed.description || null,
    category: parsed.category as any,
    format: parsed.format as any,
    year: parsed.year,
    level: parsed.level as any,
    status: "DRAFT" as any,
    rruleString: parsed.rruleString || null,
    seriesId,
    targetAudience: parsed.targetAudience as any,
    paymentRequired: parsed.paymentRequired,
    amount: parsed.amount.toFixed(2) as any,
    earlyBirdAmount: parsed.earlyBirdAmount != null ? Number(parsed.earlyBirdAmount).toFixed(2) as any : null,
    earlyBirdDeadline: parsed.earlyBirdDeadline as any,
    allowInstallments: parsed.allowInstallments,
    minInstallmentAmount: parsed.minInstallmentAmount.toFixed(2) as any,
    hasCertificate: parsed.hasCertificate,
    createdBy: session.user.id,
  });

  // Auto-generate phases from rrule if provided, else create single PRELIM phase
  if (parsed.rruleString) {
    try {
      const rule = RRule.fromString(parsed.rruleString);
      const start = new Date(parsed.year, 0, 1);
      const end = new Date(parsed.year, 11, 31);
      const dates = rule.between(start, end, true).slice(0, 20);
      let phaseNo = 1;
      for (const d of dates) {
        await db.insert(contestPhases).values({
          id: uuidv4(),
          contestId,
          phaseNo: phaseNo++,
          title: `Phase ${phaseNo - 1}`,
          type: phaseNo <= 2 ? "PRELIM" as any : phaseNo === 3 ? "SEMI" as any : "FINAL" as any,
          level: parsed.level as any,
          organizationId: orgId,
          startAt: d,
          status: "SCHEDULED" as any,
        });
      }
    } catch {}
  } else {
    await db.insert(contestPhases).values({
      id: uuidv4(),
      contestId,
      phaseNo: 1,
      title: "Preliminary",
      type: "PRELIM" as any,
      level: parsed.level as any,
      organizationId: orgId,
      status: "SCHEDULED" as any,
    });
  }

  revalidatePath("/dashboard/contests");
  return { success: true, contestId };
}

export async function getContestPhases(contestId: string) {
  return db.select().from(contestPhases).where(eq(contestPhases.contestId, contestId)).orderBy(asc(contestPhases.phaseNo));
}

export async function openContest(contestId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  await db.update(contestEvents).set({ status: "OPEN" as any, updatedAt: new Date() } as any).where(eq(contestEvents.id, contestId));

  // Notify jurisdiction
  const [contest] = await db.select().from(contestEvents).where(eq(contestEvents.id, contestId)).limit(1);
  if (contest) {
    const lvl = String(contest.level).replace(/_/g, " ");
    await db.insert(notifications).values({
      userId: session.user.id,
      title: `Contest Open [${lvl}]`,
      message: `"${contest.title}" organized by ${lvl} is now open for representative submission.`,
      type: "INFO" as any,
      actionUrl: `/contests-live/${contestId}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  }
  revalidatePath("/dashboard/contests");
  return { success: true };
}

export async function getContests() {
  const rows = await db
    .select({ contest: contestEvents, org: organizations })
    .from(contestEvents)
    .leftJoin(organizations, eq(contestEvents.organizationId, organizations.id))
    .orderBy(desc(contestEvents.year), desc(contestEvents.createdAt));
  return rows.map((r) => ({ ...r.contest, organizationName: r.org?.name || "National" }));
}

export async function getContestById(id: string) {
  const [row] = await db
    .select({ contest: contestEvents, org: organizations })
    .from(contestEvents)
    .leftJoin(organizations, eq(contestEvents.organizationId, organizations.id))
    .where(eq(contestEvents.id, id))
    .limit(1);
  if (!row) return null;
  return { ...row.contest, organizationName: row.org?.name || "National" };
}

export async function getActiveContests() {
  return db.select().from(contestEvents).where(eq(contestEvents.status, "OPEN" as any)).orderBy(desc(contestEvents.year));
}

export async function submitRepresentatives(
  contestId: string,
  phaseId: string,
  participants: { name: string; userId?: string; category?: string }[],
  organizationId: string
) {
  const session = await getServerSession();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  const [contest] = await db.select().from(contestEvents).where(eq(contestEvents.id, contestId)).limit(1);
  if (!contest) return { success: false, error: "Contest not found" };
  if (contest.status !== "OPEN" && contest.status !== "ONGOING") return { success: false, error: "Contest not open" };

  const effective = getEffectiveAmount({
    amount: contest.amount as any,
    earlyBirdAmount: (contest as any).earlyBirdAmount,
    earlyBirdDeadline: (contest as any).earlyBirdDeadline,
  });

  const created: string[] = [];
  for (const p of participants) {
    const id = uuidv4();
    await db.insert(contestRepresentatives).values({
      id,
      contestId,
      phaseId,
      organizationId,
      participantName: p.name,
      participantUserId: p.userId || null,
      category: p.category || null,
      status: "REGISTERED" as any,
      lockedAmount: contest.paymentRequired ? effective.toFixed(2) as any : null,
      paymentStatus: contest.paymentRequired ? "PENDING" as any : "SUCCESS" as any,
    } as any);
    created.push(id);
  }
  revalidatePath(`/dashboard/contests/${contestId}`);
  return { success: true, ids: created, amount: effective };
}

export async function initializeContestPayment(representativeId: string, amount?: number) {
  const [rep] = await db.select().from(contestRepresentatives).where(eq(contestRepresentatives.id, representativeId)).limit(1);
  if (!rep) return { success: false, error: "Representative not found" };
  const [contest] = await db.select().from(contestEvents).where(eq(contestEvents.id, rep.contestId)).limit(1);
  if (!contest) return { success: false, error: "Contest not found" };
  const total = rep.lockedAmount ? Number(rep.lockedAmount) : getEffectiveAmount(contest as any);
  const toPay = amount ?? total;
  if (toPay <= 0) return { success: false, error: "No payment required" };

  // Fetch org paystack subaccount
  const [org] = await db.select().from(organizations).where(eq(organizations.id, rep.organizationId)).limit(1);
  const res = await initializePayment({
    email: "contest@tmc.local",
    amount: toPay,
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/contests-live/${rep.contestId}/verify?rep=${representativeId}`,
    subaccount: (org as any)?.paystackSubaccountCode || undefined,
    metadata: { representativeId, contestId: rep.contestId, type: "CONTEST_FEE" },
  });
  if (res.success && res.reference) {
    await db.update(contestRepresentatives).set({ paymentRef: res.reference } as any).where(eq(contestRepresentatives.id, representativeId));
  }
  return res;
}

export async function verifyContestPayment(representativeId: string, reference: string) {
  const res = await verifyPayment(reference);
  if (!res.success || res.data?.status !== "success") return { success: false, error: "Verification failed" };
  const amount = Number(res.data.amount || 0);
  await db.update(contestRepresentatives).set({ paymentStatus: "SUCCESS" as any, status: "PAID" as any } as any).where(eq(contestRepresentatives.id, representativeId));
  // Create payment record
  const [rep] = await db.select().from(contestRepresentatives).where(eq(contestRepresentatives.id, representativeId)).limit(1);
  if (rep) {
    const [pay] = await db
      .insert(payments)
      .values({
        id: uuidv4(),
        userId: rep.participantUserId || null,
        organizationId: rep.organizationId,
        amount: amount.toFixed(2) as any,
        currency: "NGN",
        status: "SUCCESS" as any,
        paymentType: "CONTEST_FEE" as any,
        paystackRef: reference,
        description: `Contest fee for ${rep.participantName}`,
        paidAt: new Date(),
      } as any)
      .$returningId();
    await db.insert(contestPayments).values({ id: uuidv4(), representativeId, paymentId: pay.id, amount: amount.toFixed(2) as any } as any);
    await db.insert(financeTransactions).values({
      organizationId: rep.organizationId,
      type: "INFLOW" as any,
      amount: amount.toFixed(2) as any,
      category: "CONTEST_FEE",
      description: `Contest fee: ${rep.participantName}`,
      performedBy: rep.participantUserId || rep.organizationId,
      date: new Date(),
      metadata: { reference } as any,
    } as any);
  }
  return { success: true };
}

export async function generateTimetable(phaseId: string) {
  const reps = await db.select().from(contestRepresentatives).where(eq(contestRepresentatives.phaseId, phaseId));
  if (reps.length === 0) return { success: false, error: "No representatives" };
  await db.delete(contestTimetable).where(eq(contestTimetable.phaseId, phaseId));
  const [phase] = await db.select().from(contestPhases).where(eq(contestPhases.id, phaseId)).limit(1);
  const base = phase?.startAt ? new Date(phase.startAt) : new Date();
  for (let i = 0; i < reps.length; i++) {
    await db.insert(contestTimetable).values({
      id: uuidv4(),
      phaseId,
      participantId: reps[i].id,
      slotOrder: i + 1,
      scheduledAt: new Date(base.getTime() + i * 5 * 60000),
      durationMin: 5,
    } as any);
    await db.insert(contestCalls).values({
      id: uuidv4(),
      phaseId,
      participantId: reps[i].id,
      queueOrder: i + 1,
      status: "QUEUED" as any,
    } as any);
  }
  return { success: true };
}

export async function callParticipant(callId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  const [call] = await db.select().from(contestCalls).where(eq(contestCalls.id, callId)).limit(1);
  if (!call) return { success: false, error: "Call not found" };
  // Ensure Live room exists for phase
  const [phase] = await db.select().from(contestPhases).where(eq(contestPhases.id, call.phaseId)).limit(1);
  let liveRoomId = call.liveRoomId;
  if (!liveRoomId && phase?.meetingId) {
    const [mt] = await db.select().from(meetings).where(eq(meetings.id, phase.meetingId)).limit(1);
    liveRoomId = mt?.virtualRoomId || `contest-${phase.id}-${callId}`;
  }
  if (!liveRoomId) liveRoomId = `contest-${phase?.id}-${callId}`;
  await db.update(contestCalls).set({ status: "CALLED" as any, liveRoomId, calledAt: new Date(), calledBy: session.user.id } as any).where(eq(contestCalls.id, callId));
  await db.update(contestRepresentatives).set({ status: "CALLED" as any } as any).where(eq(contestRepresentatives.id, call.participantId));
  return { success: true, liveRoomId };
}

export async function submitScore(callId: string, criteria: Record<string, number>, comment?: string) {
  const session = await getServerSession();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  const total = Object.values(criteria).reduce((a, b) => a + Number(b), 0);
  const [existing] = await db.select().from(contestScores).where(and(eq(contestScores.callId, callId), eq(contestScores.judgeId, session.user.id))).limit(1);
  if (existing) {
    await db.update(contestScores).set({ criteria: criteria as any, total, comment: comment || null } as any).where(eq(contestScores.id, existing.id));
  } else {
    await db.insert(contestScores).values({ id: uuidv4(), callId, judgeId: session.user.id, criteria: criteria as any, total, comment: comment || null } as any);
  }
  // Check if all judges scored (at least 1 for now, promote to GRADING)
  await db.update(contestCalls).set({ status: "GRADING" as any } as any).where(eq(contestCalls.id, callId));
  return { success: true, total };
}

export async function completeCall(callId: string) {
  await db.update(contestCalls).set({ status: "COMPLETED" as any, completedAt: new Date() } as any).where(eq(contestCalls.id, callId));
  return { success: true };
}

export async function computePhaseResults(phaseId: string, promoteCount: number = 3) {
  const calls = await db.select().from(contestCalls).where(eq(contestCalls.phaseId, phaseId));
  const scores = await db.select().from(contestScores).where(inArray(contestScores.callId, calls.map((c) => c.id)));
  const byParticipant = new Map<string, number[]>();
  for (const s of scores) {
    const call = calls.find((c) => c.id === s.callId);
    if (!call) continue;
    if (!byParticipant.has(call.participantId)) byParticipant.set(call.participantId, []);
    byParticipant.get(call.participantId)!.push(s.total);
  }
  const results: { participantId: string; avg: number; total: number }[] = [];
  for (const [pid, arr] of byParticipant.entries()) {
    const total = arr.reduce((a, b) => a + b, 0);
    const avg = arr.length ? total / arr.length : 0;
    results.push({ participantId: pid, avg, total });
  }
  results.sort((a, b) => b.avg - a.avg);
  await db.delete(contestResults).where(eq(contestResults.phaseId, phaseId));
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    await db.insert(contestResults).values({
      id: uuidv4(),
      phaseId,
      participantId: r.participantId,
      totalScore: r.total,
      avgScore: r.avg.toFixed(2) as any,
      rank: i + 1,
      promoted: i < promoteCount,
    } as any);
    if (i < promoteCount) {
      await db.update(contestRepresentatives).set({ status: "PROMOTED" as any } as any).where(eq(contestRepresentatives.id, r.participantId));
    }
  }
  // Auto-create next phase representatives for promoted
  const [phase] = await db.select().from(contestPhases).where(eq(contestPhases.id, phaseId)).limit(1);
  if (phase && promoteCount > 0) {
    const nextPhaseNo = phase.phaseNo + 1;
    const [nextPhase] = await db.select().from(contestPhases).where(and(eq(contestPhases.contestId, phase.contestId), eq(contestPhases.phaseNo, nextPhaseNo))).limit(1);
    if (nextPhase) {
      const promotedIds = results.slice(0, promoteCount).map((r) => r.participantId);
      const reps = await db.select().from(contestRepresentatives).where(inArray(contestRepresentatives.id, promotedIds));
      for (const rep of reps) {
        await db.insert(contestRepresentatives).values({
          id: uuidv4(),
          contestId: rep.contestId,
          phaseId: nextPhase.id,
          organizationId: rep.organizationId,
          participantName: rep.participantName,
          participantUserId: rep.participantUserId,
          category: rep.category,
          status: "REGISTERED" as any,
        } as any);
      }
    }
  }
  return { success: true, results };
}

export async function submitWritten(phaseId: string, participantId: string, answer: any, html?: string, plainText?: string, prompt?: string) {
  const [existing] = await db.select().from(contestWritten).where(and(eq(contestWritten.phaseId, phaseId), eq(contestWritten.participantId, participantId))).limit(1);
  if (existing) {
    await db.update(contestWritten).set({ answer: answer as any, html: html || null, plainText: plainText || null, prompt: prompt || null, submittedAt: new Date(), status: "SUBMITTED" as any, timeSpentSec: 0 } as any).where(eq(contestWritten.id, existing.id));
    return { success: true, id: existing.id };
  }
  const id = uuidv4();
  await db.insert(contestWritten).values({
    id,
    phaseId,
    participantId,
    prompt: prompt || null,
    answer: answer as any,
    html: html || null,
    plainText: plainText || null,
    submittedAt: new Date(),
    status: "SUBMITTED" as any,
  } as any);
  return { success: true, id };
}

export async function getLiveQueue(phaseId: string) {
  return db.select().from(contestCalls).where(eq(contestCalls.phaseId, phaseId)).orderBy(asc(contestCalls.queueOrder));
}

export async function getContestResults(phaseId: string) {
  return db.select().from(contestResults).where(eq(contestResults.phaseId, phaseId)).orderBy(asc(contestResults.rank));
}

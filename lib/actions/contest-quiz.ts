"use server";

import { db } from "@/lib/db";
import {
    contestQuizzes, contestQuizQuestions, contestQuizOptions, contestQuizAttempts, contestQuizAnswers,
    contestRepresentatives, contestPhases, contestEvents,
} from "@/lib/db/schema";
import { and, eq, sql, asc, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/session";

export async function createQuiz(data: {
    phaseId: string;
    title: string;
    description?: string;
    mode: "LIVE_SYNC_RACE" | "ASYNC_STANDARD";
    durationSec?: number;
    questionWindowSec?: number;
    maxAttempts?: number;
    shuffleQuestions?: boolean;
    startsAt?: string;
    endsAt?: string;
}) {
    const session = await getServerSession();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const id = crypto.randomUUID();
    await db.insert(contestQuizzes).values({
        id,
        phaseId: data.phaseId,
        title: data.title,
        description: data.description || null,
        mode: data.mode,
        durationSec: data.durationSec ?? 60,
        questionWindowSec: data.questionWindowSec ?? 30,
        maxAttempts: data.maxAttempts ?? 1,
        shuffleQuestions: !!data.shuffleQuestions,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        published: false,
    } as any);
    revalidatePath(`/dashboard/contests`);
    return { success: true, id };
}

export async function addQuestion(data: {
    quizId: string;
    prompt: string;
    imageUrl?: string;
    points?: number;
    options: { label: string }[];
    correctIndex: number;
    explanation?: string;
}) {
    const session = await getServerSession();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const lastQ = await db.select({ max: sql<number>`COALESCE(MAX(${contestQuizQuestions.questionNo}),0)` }).from(contestQuizQuestions).where(eq(contestQuizQuestions.quizId, data.quizId));
    const qNo = (lastQ[0]?.max ?? 0) + 1;
    const qid = crypto.randomUUID();
    await db.insert(contestQuizQuestions).values({
        id: qid, quizId: data.quizId, questionNo: qNo, prompt: data.prompt,
        imageUrl: data.imageUrl || null, points: data.points ?? 1, explanation: data.explanation || null,
    } as any);
    const optionIds: string[] = [];
    for (let i = 0; i < data.options.length; i++) {
        const oid = crypto.randomUUID();
        optionIds.push(oid);
        await db.insert(contestQuizOptions).values({
            id: oid, questionId: qid, label: data.options[i].label, optionNo: i + 1,
        } as any);
    }
    const correctOptionId = optionIds[data.correctIndex] || optionIds[0];
    await db.update(contestQuizQuestions).set({ correctOptionId }).where(eq(contestQuizQuestions.id, qid));
    return { success: true, questionId: qid };
}

export async function deleteQuestion(questionId: string) {
    const session = await getServerSession();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    await db.delete(contestQuizQuestions).where(eq(contestQuizQuestions.id, questionId));
    return { success: true };
}

export async function publishQuiz(quizId: string) {
    const session = await getServerSession();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    await db.update(contestQuizzes).set({ published: true } as any).where(eq(contestQuizzes.id, quizId));
    revalidatePath(`/dashboard/contests`);
    return { success: true };
}

export async function getQuiz(quizId: string) {
    const [quiz] = await db.select().from(contestQuizzes).where(eq(contestQuizzes.id, quizId)).limit(1);
    if (!quiz) return null;
    const qs = await db.select().from(contestQuizQuestions).where(eq(contestQuizQuestions.quizId, quizId)).orderBy(asc(contestQuizQuestions.questionNo));
    const qIds = qs.map((q: any) => q.id);
    const opts = qIds.length ? await db.select().from(contestQuizOptions).where(inArray(contestQuizOptions.questionId, qIds)) : [];
    return {
        quiz,
        questions: qs.map((q: any) => ({
            ...q,
            options: opts.filter((o: any) => o.questionId === q.id),
        })),
    };
}

export async function getQuizByPhase(phaseId: string) {
    const [quiz] = await db.select().from(contestQuizzes).where(eq(contestQuizzes.phaseId, phaseId)).limit(1);
    if (!quiz) return null;
    return getQuiz(quiz.id);
}

export async function startAttempt(quizId: string, participantId: string) {
    const session = await getServerSession();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    // Already an attempt?
    const existing = await db.select().from(contestQuizAttempts).where(and(eq(contestQuizAttempts.quizId, quizId), eq(contestQuizAttempts.participantId, participantId))).limit(1);
    if (existing.length) return { success: true, attemptId: existing[0].id, resumed: true };
    const id = crypto.randomUUID();
    await db.insert(contestQuizAttempts).values({
        id, quizId, participantId,
        userId: (session.user as any).id || null,
        status: 'IN_PROGRESS', totalScore: 0, correctCount: 0, totalTimeMs: 0,
    } as any);
    return { success: true, attemptId: id, resumed: false };
}

export async function submitAnswer(data: {
    attemptId: string;
    questionId: string;
    selectedOptionId: string | null;
    timeMs: number;
}) {
    const session = await getServerSession();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const [q] = await db.select().from(contestQuizQuestions).where(eq(contestQuizQuestions.id, data.questionId)).limit(1);
    if (!q) return { success: false, error: "Question not found" };
    const isCorrect = !!(data.selectedOptionId && q.correctOptionId && data.selectedOptionId === q.correctOptionId);
    const pointsEarned = isCorrect ? (q.points ?? 1) : 0;
    const now = new Date();

    // upsert
    const existing = await db.select().from(contestQuizAnswers).where(and(eq(contestQuizAnswers.attemptId, data.attemptId), eq(contestQuizAnswers.questionId, data.questionId))).limit(1);
    if (existing.length) {
        await db.update(contestQuizAnswers).set({
            selectedOptionId: data.selectedOptionId, isCorrect, pointsEarned, timeMs: data.timeMs, submittedAt: now,
        } as any).where(eq(contestQuizAnswers.id, existing[0].id));
    } else {
        await db.insert(contestQuizAnswers).values({
            id: crypto.randomUUID(),
            attemptId: data.attemptId,
            questionId: data.questionId,
            selectedOptionId: data.selectedOptionId,
            isCorrect, pointsEarned, timeMs: data.timeMs, submittedAt: now,
        } as any);
    }
    return { success: true, isCorrect, correctOptionId: q.correctOptionId, explanation: q.explanation, pointsEarned };
}

export async function finishAttempt(attemptId: string) {
    const session = await getServerSession();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const answers = await db.select().from(contestQuizAnswers).where(eq(contestQuizAnswers.attemptId, attemptId));
    const totalScore = answers.reduce((s, a: any) => s + (a.pointsEarned ?? 0), 0);
    const correctCount = answers.filter((a: any) => a.isCorrect).length;
    const totalTimeMs = answers.reduce((s, a: any) => s + (a.timeMs ?? 0), 0);
    await db.update(contestQuizAttempts).set({
        status: 'COMPLETED', finishedAt: new Date(), totalScore, correctCount, totalTimeMs,
    } as any).where(eq(contestQuizAttempts.id, attemptId));
    return { success: true, totalScore, correctCount, totalTimeMs };
}

export async function getAttemptForReview(attemptId: string) {
    const [a] = await db.select().from(contestQuizAttempts).where(eq(contestQuizAttempts.id, attemptId)).limit(1);
    if (!a) return null;
}

export async function getAttemptLeaderboard(quizId: string) {
    // For LIVE_SYNC_RACE: rank by correctCount desc, then avg time of correct submissions asc (fastest correct wins).
    // For ASYNC_STANDARD: rank by totalScore desc.
    return db
        .select({
            attemptId: contestQuizAttempts.id,
            participantId: contestQuizAttempts.participantId,
            totalScore: contestQuizAttempts.totalScore,
            correctCount: contestQuizAttempts.correctCount,
            totalTimeMs: contestQuizAttempts.totalTimeMs,
            finishedAt: contestQuizAttempts.finishedAt,
            participantName: contestRepresentatives.participantName,
        })
        .from(contestQuizAttempts)
        .leftJoin(contestRepresentatives, eq(contestRepresentatives.id, contestQuizAttempts.participantId))
        .where(and(eq(contestQuizAttempts.quizId, quizId), eq(contestQuizAttempts.status, 'COMPLETED' as any)))
        .orderBy(desc(contestQuizAttempts.totalScore), asc(contestQuizAttempts.totalTimeMs));
}

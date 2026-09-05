export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { getContestById } from "@/lib/actions/contests";
import { getQuizByPhase } from "@/lib/actions/contest-quiz";
import { db } from "@/lib/db";
import { contestRepresentatives } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Zap, BookOpen, Trophy } from "lucide-react";
import { QuizPlayer } from "@/components/contests-live/quiz/quiz-player";

export default async function TakeQuizPage({ params }: { params: Promise<{ id: string; phaseId: string }> }) {
    const { id, phaseId } = await params;
    const session = await getServerSession();
    if (!session?.user?.id) redirect("/auth/signin");

    const contest = await getContestById(id);
    if (!contest) redirect("/contests-live");
    const result = await getQuizByPhase(phaseId);
    if (!result) redirect(`/contests-live/${id}`);

    const { quiz, questions } = result;

    // Representative of current user
    const userId = (session.user as any).id;
    const repRows = await db.select().from(contestRepresentatives).where(and(eq(contestRepresentatives.phaseId, phaseId), eq(contestRepresentatives.participantUserId, userId))).limit(1);
    const myRep = repRows[0];

    // Officials (coordinators) can take too via "umpire/judge" pass — allow if user is admin or has official role for this contest's org
    const isStaff = session.user.isSuperAdmin || session.user.officialLevel === "NATIONAL" || !!session.user.officialId;

    return (
        <DashboardLayout>
            <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <Badge className="bg-emerald-700 text-white mb-2">{contest.title}</Badge>
                        <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
                            {quiz.mode === "LIVE_SYNC_RACE" ? <Zap className="h-5 w-5 text-rose-600" /> : <BookOpen className="h-5 w-5 text-indigo-600" />}
                            {quiz.title}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {quiz.mode === "LIVE_SYNC_RACE" ? "All participants answer the same question at the same time — fastest correct wins." : "Questions answered sequentially — instant feedback — highest score wins."}
                        </p>
                    </div>
                    <Badge variant="outline">{questions.length} questions</Badge>
                </div>

                {!myRep && !isStaff ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        <b>Not eligible.</b> You must be registered as a representative for this phase to take the quiz. If you should be eligible, ask the contest coordinator to add you.
                    </div>
                ) : !quiz.published ? (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                        The quiz is not published yet. Ask the coordinator to publish it.
                    </div>
                ) : (
                    <QuizPlayer
                        quizId={quiz.id}
                        mode={quiz.mode as any}
                        durationSec={quiz.durationSec ?? 60}
                        questionWindowSec={quiz.questionWindowSec ?? 30}
                        questions={questions as any}
                        participantId={myRep?.id ?? null}
                        participantName={myRep?.participantName ?? (session.user as any).name ?? "Guest"}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}

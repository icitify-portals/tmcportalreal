export const dynamic = "force-dynamic";
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getContestById, getContestPhases } from "@/lib/actions/contests";
import { getQuizByPhase } from "@/lib/actions/contest-quiz";
import { db } from "@/lib/db";
import { contestRepresentatives } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ListChecks, Timer, Zap, BookOpen } from "lucide-react";
import { QuizBuilder } from "@/components/contests-live/quiz/quiz-builder";
import { QuizLeaderboard } from "@/components/contests-live/quiz/quiz-leaderboard";

export default async function PhaseQuizPage({ params }: { params: Promise<{ id: string; phaseId: string }> }) {
    const session = await getServerSession();
    if (!session?.user?.id) redirect("/auth/signin");
    const { id, phaseId } = await params;
    const contest = await getContestById(id);
    if (!contest) redirect("/dashboard/contests");
    const phases = await getContestPhases(id);
    const phase = phases.find((p: any) => p.id === phaseId);
    if (!phase) redirect(`/dashboard/contests/${id}`);
    const quizData = await getQuizByPhase(phaseId);
    const quiz = quizData?.quiz;
    const questions = quizData?.questions ?? [];
    const reps = await db.select().from(contestRepresentatives).where(eq(contestRepresentatives.phaseId, phaseId));

    return (
        <DashboardLayout>
            <div className="p-4 md:p-8 space-y-6 max-w-5xl">
                <div className="flex items-center justify-between">
                    <div>
                        <Badge className="bg-emerald-600 text-white mb-2">{contest.title} • {phase.title}</Badge>
                        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2"><ListChecks className="h-6 w-6 text-emerald-700" />Quiz Setup</h2>
                        <p className="text-sm text-muted-foreground">{phase.type} • {phase.level} • {phase.status}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline"><Link href={`/dashboard/contests/${id}/phases/${phaseId}`}><ArrowLeft className="h-4 w-4 mr-2" />Back</Link></Button>
                        {quiz && (
                            <Button asChild variant="outline"><Link href={`/dashboard/contests/${id}/phases/${phaseId}`}>Manage Phase</Link></Button>
                        )}
                    </div>
                </div>

                {!quiz ? (
                    <QuizBuilder phaseId={phaseId} existing={null} participantCount={reps.length} />
                ) : (
                    <div className="space-y-6">
                        <div className="rounded-xl border border-emerald-100 bg-white p-5">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    {quiz.mode === "LIVE_SYNC_RACE"
                                        ? <Badge className="bg-rose-600 text-white"><Zap className="h-3 w-3 mr-1" /> LIVE SYNC RACE</Badge>
                                        : <Badge className="bg-indigo-600 text-white"><BookOpen className="h-3 w-3 mr-1" /> ASYNC STANDARD</Badge>}
                                    <h3 className="font-bold">{quiz.title}</h3>
                                    {quiz.published
                                        ? <Badge className="bg-emerald-600 text-white">Published</Badge>
                                        : <Badge variant="outline">Draft</Badge>}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {quiz.mode === "LIVE_SYNC_RACE" ? `Question window: ${quiz.questionWindowSec ?? 30}s` : `Total time: ${quiz.durationSec ?? 60}s`}
                                </div>
                            </div>
                        </div>

                        <QuizBuilder phaseId={phaseId} existing={quiz} participantCount={reps.length} />
                        <QuizLeaderboard quizId={quiz.id} mode={quiz.mode as any} />
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

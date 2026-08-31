export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { getContestById, getContestPhases, getLiveQueue, getContestResults } from "@/lib/actions/contests";
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { PublicNav } from "@/components/layout/public-nav";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ContestLiveRoom } from "@/components/contests-live/contest-live-room";
import { ScoreCard } from "@/components/contests-live/score-card";
import { LiveBoard } from "@/components/contests-live/live-board";
import { WrittenEditor } from "@/components/contests-live/written-editor";
import { ResultsPanel } from "@/components/contests-live/results-panel";
import { Badge } from "@/components/ui/badge";

export default async function ContestLivePhasePage({ params }: { params: Promise<{ id: string; phaseId: string }> }) {
  const { id, phaseId } = await params;
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/auth/signin");
  const contest = await getContestById(id);
  if (!contest) return notFound();
  const phases = await getContestPhases(id);
  const phase = phases.find((p: any) => p.id === phaseId);
  if (!phase) return notFound();
  const calls = await getLiveQueue(phaseId);
  const results = await getContestResults(phaseId);
  const activeCall = calls.find((c: any) => c.status === "CALLED" || c.status === "GRADING");

  const isCoordinator = session.user.isSuperAdmin || session.user.roles?.some((r: any) => r.jurisdictionLevel === "SYSTEM") || !!session.user.officialId;
  const isWritten = contest.category === "WRITTEN";

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold">{contest.title} — {phase.title}</h2>
            <p className="text-sm text-muted-foreground">{contest.category} • {phase.type} • {phase.level} • {phase.status}</p>
          </div>
          <Badge className="bg-emerald-600 text-white">Live</Badge>
        </div>

        {isWritten ? (
          <div className="max-w-2xl mx-auto">
            <WrittenEditor phaseId={phaseId} participantId={(session.user as any).memberId || (session.user as any).officialId || session.user.id} prompt={contest.description || ""} />
          </div>
        ) : isCoordinator ? (
          <LiveBoard phaseId={phaseId} category={contest.category} />
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            {activeCall ? (
              <>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-emerald-700 font-bold">You are on stage</p>
                  <p className="text-lg font-semibold text-emerald-900">You've been called — join the room below</p>
                </div>
                <ContestLiveRoom room={activeCall.liveRoomId as string} height={380} />
                <div className="bg-white border rounded-xl p-4"><ScoreCard callId={activeCall.id} category={contest.category} /></div>
              </>
            ) : (
              <div className="p-12 text-center border rounded-xl bg-white text-muted-foreground">You are in the queue. The umpire will call you when it&apos;s your turn.</div>
            )}
          </div>
        )}

        <div className="border rounded-xl p-4 bg-white">
          <ResultsPanel phaseId={phaseId} initialResults={results} />
        </div>
      </div>
    </DashboardLayout>
  );
}

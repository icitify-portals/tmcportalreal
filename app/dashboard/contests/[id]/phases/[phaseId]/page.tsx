export const dynamic = "force-dynamic";
import { getContestById, getContestPhases, getLiveQueue, getContestResults } from "@/lib/actions/contests";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { LiveBoard } from "@/components/contests-live/live-board";
import { ResultsPanel } from "@/components/contests-live/results-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateTimetable } from "@/lib/actions/contests";
import { revalidatePath } from "next/cache";

async function generateTT(phaseId: string) {
  "use server";
  const res = await generateTimetable(phaseId);
  revalidatePath(`/dashboard/contests`);
  return res;
}

export default async function ContestPhaseManagePage({ params }: { params: Promise<{ id: string; phaseId: string }> }) {
  const { id, phaseId } = await params;
  const contest = await getContestById(id);
  if (!contest) return notFound();
  const phases = await getContestPhases(id);
  const phase = phases.find((p: any) => p.id === phaseId);
  if (!phase) return notFound();
  const calls = await getLiveQueue(phaseId);
  const results = await getContestResults(phaseId);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{contest.title} — Phase {phase.phaseNo}: {phase.title}</h2>
            <p className="text-sm text-muted-foreground">{phase.type} • {phase.level} • {phase.status} {phase.venue ? `• ${phase.venue}` : ""}</p>
          </div>
          <div className="flex gap-2">
            <form action={async () => { "use server"; await generateTT(phaseId); }}>
              <Button size="sm" variant="outline">Generate Timetable ({calls.length} queued)</Button>
            </form>
            <Button asChild size="sm" variant="outline"><Link href={`/contests-live/${id}/live/${phaseId}`}>Open Live Session</Link></Button>
            <Button asChild size="sm"><Link href={`/dashboard/contests/${id}`}>Back</Link></Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <LiveBoard phaseId={phaseId} category={contest.category} />
          <div className="border rounded-xl p-4 bg-white">
            <ResultsPanel phaseId={phaseId} initialResults={results} />
          </div>
        </div>

        <div className="text-xs text-muted-foreground border rounded-lg p-3 bg-muted/30">
          <b>Flow:</b> Submit representatives → <b>Generate Timetable</b> (creates the call queue + slots) → <b>Call Next</b> to bring a participant on stage → judges score (Score Card) → <b>Complete</b> → when all graded, <b>Compute/Auto-Promote</b> to advance top finishers to the next phase.
        </div>
      </div>
    </DashboardLayout>
  );
}

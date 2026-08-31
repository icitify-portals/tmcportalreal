export const dynamic = "force-dynamic";
import { getContestById, getContestPhases } from "@/lib/actions/contests";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function ContestManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contest = await getContestById(id);
  if (!contest) return notFound();
  const phases = await getContestPhases(id);
  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{contest.title}</h2>
            <p className="text-sm text-muted-foreground">{contest.category} • {contest.level} • {contest.status} • {contest.year}</p>
            {contest.paymentRequired && <p className="text-xs font-semibold text-emerald-700">Fee: ₦{Number(contest.amount).toLocaleString()} {contest.earlyBirdAmount ? `(Early bird ₦${Number(contest.earlyBirdAmount).toLocaleString()})` : ""}</p>}
          </div>
          <Button asChild variant="outline"><Link href="/dashboard/contests">Back</Link></Button>
        </div>
        <Card>
          <CardHeader><CardTitle>Phases — Timetable & Live Calls</CardTitle><CardDescription>Branch → LGA → State → National. Generate timetable, call participants (umpire), judges score, promote to next phase.</CardDescription></CardHeader>
          <CardContent>
            {phases.length === 0 ? (
              <p className="text-sm text-muted-foreground">No phases yet.</p>
            ) : (
              <div className="space-y-3">
                {phases.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <div className="font-semibold text-sm">{p.phaseNo}. {p.title} — {p.type} • {p.level}</div>
                      <div className="text-xs text-muted-foreground">{p.venue || "TBD"} • {p.startAt ? new Date(p.startAt).toLocaleDateString() : "Not scheduled"} • {p.status}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline"><Link href={`/dashboard/contests/${id}/phases/${p.id}`}>Manage</Link></Button>
                      <Button asChild size="sm" variant="outline"><Link href={`/contests-live/${id}/live/${p.id}`}>Live</Link></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button asChild><Link href={`/contests-live/${id}/apply`}>Submit Representatives (Jurisdiction)</Link></Button>
          <Button asChild variant="outline"><Link href={`/contests-live/${id}`}>Public View</Link></Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

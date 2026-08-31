import { getContestById } from "@/lib/actions/contests";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ContestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contest = await getContestById(id);
  if (!contest) return notFound();
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      <h1 className="text-3xl font-bold">{contest.title}</h1>
      <p className="text-muted-foreground">{contest.description}</p>
      <p className="text-sm">Category: {contest.category} • Level: {contest.level} • {contest.status}</p>
      {contest.paymentRequired && <p className="text-sm font-semibold text-emerald-700">Fee: ₦{Number(contest.amount).toLocaleString()} {contest.earlyBirdAmount ? `(Early bird ₦${Number(contest.earlyBirdAmount).toLocaleString()} till ${contest.earlyBirdDeadline ? new Date(contest.earlyBirdDeadline).toLocaleDateString() : ""})` : ""}</p>}
      <div className="flex gap-2">
        <Button asChild><Link href={`/contests-live/${id}/apply`}>Submit Representatives</Link></Button>
        <Button asChild variant="outline"><Link href={`/contests-live`}>Back</Link></Button>
      </div>
    </div>
  );
}

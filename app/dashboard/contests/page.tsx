export const dynamic = "force-dynamic";
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getContests } from "@/lib/actions/contests";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Plus } from "lucide-react";

export default async function ContestsDashboardPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/auth/signin");
  const contests = await getContests();
  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Contests — Real-Time (Quran/Debate/Written)</h2>
            <p className="text-sm text-muted-foreground">Isolated from Forms. Payment-enabled. Jurisdiction-based representatives, timetable, umpire calls, judge grading, phased promotion.</p>
          </div>
          <Button asChild><Link href="/dashboard/contests/new"><Plus className="mr-2 h-4 w-4" />New Contest</Link></Button>
        </div>
        {contests.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed rounded-xl">No contests yet. Create one.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contests.map((c: any) => (
              <Card key={c.id}>
                <CardHeader>
                  <div className="flex gap-2"><Badge>{c.category}</Badge><Badge variant="outline">{c.level}</Badge><Badge className={c.status==="OPEN"?"bg-emerald-600 text-white":""}>{c.status}</Badge></div>
                  <CardTitle className="mt-2">{c.title}</CardTitle>
                  <CardDescription>{c.organizationName} • {c.year} • {c.format}</CardDescription>
                </CardHeader>
                <div className="p-4 pt-0 flex gap-2">
                  <Button asChild size="sm" variant="outline"><Link href={`/dashboard/contests/${c.id}`}>Manage</Link></Button>
                  <Button asChild size="sm" variant="outline"><Link href={`/contests-live/${c.id}`}>Public</Link></Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

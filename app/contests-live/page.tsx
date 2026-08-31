export const dynamic = "force-dynamic";
import { getActiveContests } from "@/lib/actions/contests";
import { PublicNav } from "@/components/layout/public-nav";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Trophy } from "lucide-react";

export default async function ContestsLivePage() {
  const contests = await getActiveContests();
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Live Contests — Quran • Debate • Written</h1>
          <p className="text-muted-foreground mt-2">Jurisdictions apply representatives when open. Umpire calls, judges score, results live till final.</p>
        </div>
        {contests.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl bg-white">No open contests. Check back soon.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contests.map((c: any) => (
              <Card key={c.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex gap-2">
                    <Badge>{c.category}</Badge>
                    <Badge variant="outline">{c.level}</Badge>
                    <Badge className="bg-emerald-600 text-white">{c.status}</Badge>
                  </div>
                  <CardTitle className="line-clamp-2 mt-2">{c.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.year} • {c.format}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3">{c.description || "Real-time competition across jurisdictions."}</p>
                  {c.paymentRequired && <p className="text-xs font-semibold text-emerald-700 mt-2">Fee: ₦{Number(c.amount).toLocaleString()} {c.earlyBirdAmount ? `(Early bird ₦${Number(c.earlyBirdAmount).toLocaleString()})` : ""}</p>}
                </CardContent>
                <div className="p-4 border-t flex gap-2">
                  <Button asChild className="flex-1 bg-emerald-700 hover:bg-emerald-800"><Link href={`/contests-live/${c.id}/apply`}><Trophy className="mr-2 h-4 w-4" />Apply Representatives</Link></Button>
                  <Button asChild variant="outline"><Link href={`/contests-live/${c.id}`}>View</Link></Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

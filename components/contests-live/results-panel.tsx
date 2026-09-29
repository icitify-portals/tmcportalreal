"use client";

import { useState, useTransition } from "react";
import { computePhaseResults } from "@/lib/actions/contests";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trophy, RefreshCw, Megaphone, Award, Loader2 } from "lucide-react";

export function ResultsPanel({ phaseId, initialResults }: { phaseId: string; initialResults: any[] }) {
  const [results, setResults] = useState(initialResults);
  const [isPending, startTransition] = useTransition();
  const [announced, setAnnounced] = useState(false);

  function compute() {
    startTransition(async () => {
      const res = await computePhaseResults(phaseId, 3);
      if (res.success) {
        setResults(res.results);
        toast.success("Results computed");
      } else toast.error("No scores to compute");
    });
  }

  async function announce() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Contest Results", url: window.location.href });
        setAnnounced(true); toast.success("Results shared"); return;
      } catch {}
    }
    if (typeof navigator !== "undefined") { await navigator.clipboard.writeText(window.location.href); toast.success("Results link copied — post to broadcast"); setAnnounced(true); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Results — Phase {phaseId.slice(0, 8)}</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={compute} disabled={isPending}>{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}Compute/Auto-Promote</Button>
          <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800" onClick={announce}><Megaphone className="h-4 w-4 mr-1" />Announce</Button>
        </div>
      </div>
      {results.length === 0 ? (
        <p className="text-sm text-muted-foreground">No results yet. Grade all calls then click <b>Compute/Auto-Promote</b>.</p>
      ) : (
        <div className="space-y-2">
          {(() => {
            const winner = results.find((r: any) => r.isWinner || r.rank === 1);
            return winner ? (
              <div className="flex items-center gap-3 rounded-lg border-2 border-amber-400 bg-amber-50 px-4 py-3">
                <Trophy className="h-7 w-7 text-amber-500" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-700">Winner</div>
                  <div className="font-bold text-lg text-amber-900">{winner.participantName || "Participant"}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-xs text-amber-700">Avg score</div>
                  <div className="font-bold text-amber-900">{Number(winner.avgScore).toFixed(2)}</div>
                </div>
              </div>
            ) : null;
          })()}
          {results.map((r: any) => (
            <div key={r.participantId} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${r.rank === 1 ? "bg-amber-50 border-amber-200" : "bg-white"}`}>
              <div className="flex items-center gap-3">
                {r.rank <= 3 && <Trophy className={`h-5 w-5 ${r.rank === 1 ? "text-amber-500" : r.rank === 2 ? "text-gray-400" : "text-amber-700"}`} />}
                <div>
                  <div className="font-medium text-sm">#{r.rank} — {r.participantName || "Participant"}</div>
                  <div className="text-xs text-muted-foreground">Avg score: {Number(r.avgScore).toFixed(2)} (total {r.totalScore})</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(r.isWinner || r.rank === 1) && <Badge className="bg-amber-500 text-white"><Trophy className="h-3 w-3 mr-1" />WINNER</Badge>}
                {r.promoted && <Badge className="bg-emerald-600 text-white"><Award className="h-3 w-3 mr-1" />PROMOTED</Badge>}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Top finishers auto-advance to the next phase. Use <b>Announce</b> or the broadcast module to publish results portal-wide.</p>
        </div>
      )}
    </div>
  );
}

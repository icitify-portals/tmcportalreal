"use client";

import { useState, useEffect } from "react";
import { callParticipant, completeCall, getLiveQueue } from "@/lib/actions/contests";
import { ContestLiveRoom } from "./contest-live-room";
import { ScoreCard } from "./score-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PhoneCall, CheckCircle, Loader2, RefreshCw } from "lucide-react";

export function LiveBoard({ phaseId, category }: { phaseId: string; category: string }) {
  const [calls, setCalls] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const q = await getLiveQueue(phaseId);
    setCalls(q);
    setActive(q.find((c: any) => c.status === "CALLED" || c.status === "GRADING") || null);
    setLoading(false);
  }

  useEffect(() => { load(); }, [phaseId]);

  async function callNext() {
    const next = calls.find((c: any) => c.status === "QUEUED");
    if (!next) return toast.error("No queued participants");
    const res = await callParticipant(next.id);
    if (res.success) { toast.success("Participant called"); await load(); }
    else toast.error(res.error || "Failed");
  }

  async function finish() {
    if (!active) return;
    await completeCall(active.id);
    toast.success("Call completed");
    await load();
  }

  const queued = calls.filter((c: any) => c.status === "QUEUED");
  const done = calls.filter((c: any) => c.status === "COMPLETED");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Queue */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Call Queue</h3>
          <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-3 w-3 mr-1" />Refresh</Button>
        </div>
        <Button size="sm" onClick={callNext} className="w-full mb-3 bg-emerald-700 hover:bg-emerald-800"><PhoneCall className="h-4 w-4 mr-2" />Call Next</Button>
        <div className="space-y-1 max-h-64 overflow-auto">
          {queued.length === 0 && done.length === 0 && <p className="text-xs text-muted-foreground">No participants queued yet. Generate timetable first.</p>}
          {calls.map((c: any) => (
            <div key={c.id} className={`flex items-center justify-between px-2 py-1.5 rounded border text-xs ${active?.id === c.id ? "bg-emerald-50 border-emerald-200" : "bg-white"}`}>
              <span className="truncate">#{c.queueOrder} {c.participantName || "—"}</span>
              <Badge variant="outline" className={c.status === "COMPLETED" ? "bg-blue-100" : c.status === "QUEUED" ? "bg-gray-100" : "bg-emerald-100"}>{c.status}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Live room + scoring */}
      <div className="lg:col-span-2 space-y-4">
        {active ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Live — Participant #{active.queueOrder}</h3>
                <p className="text-xs text-muted-foreground">Room: {active.liveRoomId}</p>
              </div>
              <Button size="sm" variant="outline" onClick={finish}><CheckCircle className="h-4 w-4 mr-1" />Complete</Button>
            </div>
            <ContestLiveRoom room={active.liveRoomId} height={360} />
            <div className="bg-white border rounded-xl p-4">
              <ScoreCard callId={active.id} category={category} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center bg-white border rounded-xl p-12 text-center text-muted-foreground">
            <PhoneCall className="h-10 w-10 mb-2 opacity-40" />
            <p>No participant on stage. Click <b>Call Next</b> to bring someone up.</p>
          </div>
        )}
      </div>
    </div>
  );
}

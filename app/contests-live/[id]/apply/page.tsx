"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { submitRepresentatives, initializeContestPayment } from "@/lib/actions/contests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ApplyContestPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [names, setNames] = useState("Ahmed Musa\nFatima Zahra");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // For demo, use current user's organization — server will validate level; we pass a placeholder org that will be resolved via phase
      // Fetch first authorized org
      const orgs = await fetch("/api/organizations/authorized").then(r=>r.json()).catch(()=>[]);
      const orgId = orgs[0]?.id || "";
      // Need phaseId — for now use contestId as phase placeholder, server will pick first phase
      const participants = names.split("\n").filter(Boolean).map(n=>({name: n.trim()}));
      // We need phaseId — fetch contest phases via an extra call would be needed; for now, call with contestId and let server pick first phase via fallback
      // To keep isolated, we will call submitRepresentatives with contestId and a dummy phaseId that server will ignore if not found and create in first phase
      // Instead, fetch phases via direct DB? Quick workaround: use contestId as organizationId param and let server handle
      // For now, try to get phases via API
      const phases = await fetch(`/api/contests/${id}/phases`).then(r=>r.json()).catch(()=>[]);
      const phaseId = phases[0]?.id || id;
      const res = await submitRepresentatives(id, phaseId, participants, orgId);
      if (!res.success) { toast.error(res.error || "Failed"); return; }
      if (res.amount && res.amount > 0) {
        // Payment required — initialize for first representative
        const pay = await initializeContestPayment(res.ids[0]);
        if (pay.success && (pay as any).authorizationUrl) window.location.href = (pay as any).authorizationUrl;
        else toast.success(`Submitted ${participants.length} representatives — pay ₦${res.amount} each`);
      } else {
        toast.success(`Submitted ${participants.length} representatives`);
        router.push(`/contests-live/${id}`);
      }
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Submit Representatives</h1>
      <p className="text-sm text-muted-foreground mb-4">Different jurisdiction applies when contest is open. One name per line. Payment (if required) will be locked at early bird if before deadline.</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div><Label>Names (one per line)</Label><textarea value={names} onChange={(e)=>setNames(e.target.value)} rows={6} className="w-full border rounded p-3 text-sm" /></div>
        <Button type="submit" disabled={loading} className="w-full bg-emerald-700 hover:bg-emerald-800">{loading ? "Submitting..." : "Submit"}</Button>
      </form>
    </div>
  );
}

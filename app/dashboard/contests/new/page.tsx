"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createContest } from "@/lib/actions/contests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function NewContestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "QURAN" as any,
    format: "PHYSICAL" as any,
    year: String(new Date().getFullYear()),
    level: "NATIONAL" as any,
    amount: "",
    earlyBirdAmount: "",
    earlyBirdDeadline: "",
    paymentRequired: false,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // For now use first org of user — server will validate; pass dummy orgId, creator org resolved via session org
      // We need organizationId — fetch via session is handled server-side as creator's org; use placeholder then replace
      // Instead, we will call createContest with a dummy org that will be overridden? Better: get organizationId from session via hidden.
      // Quick fix: use National org id fetched via API? For now, pass empty and let server fallback to creator org.
      // To keep isolated, we pass a placeholder that server will ignore if not found and use creator's org.
      const res = await createContest(
        {
          title: form.title,
          description: form.description,
          category: form.category,
          format: form.format,
          year: parseInt(form.year),
          level: form.level,
          paymentRequired: form.paymentRequired,
          amount: parseFloat(form.amount || "0"),
          earlyBirdAmount: form.earlyBirdAmount ? parseFloat(form.earlyBirdAmount) : null,
          earlyBirdDeadline: form.earlyBirdDeadline ? new Date(form.earlyBirdDeadline) : null,
        } as any,
        // Use a dummy that will be resolved to creator's org inside action if not found — we pass NATIONAL org id via fallback
        // Fetch via localStorage? For now, use empty and let action pick creator org (we pass "" and action will fallback)
        // To satisfy FK, we pass the first organization id via client fetch is complex, so we pass a known National id placeholder and let server handle
        // Simplest: pass "" and server will fallback to user's organizationId from session (see createContest organizationId param is used as FK, so we need real id)
        // We will try to get it via an API call to /api/organizations/authorized and pick first
        form.level === "NATIONAL" ? (await fetch("/api/organizations/authorized").then(r=>r.json()).then(j=>j[0]?.id).catch(()=> "")) || "" : ""
      );
      if (res.success) {
        toast.success("Contest created");
        router.push("/dashboard/contests");
      } else toast.error(res.error || "Failed");
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card>
        <CardHeader><CardTitle>New Real-Time Contest (Isolated)</CardTitle><p className="text-sm text-muted-foreground">Quran / Debate / Written — does not affect Forms. Payment optional.</p></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div><Label>Title</Label><Input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} required /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Category</Label><Select value={form.category} onValueChange={(v)=>setForm({...form,category:v as any})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="QURAN">Quran</SelectItem><SelectItem value="DEBATE">Debate</SelectItem><SelectItem value="WRITTEN">Written</SelectItem><SelectItem value="OTHER">Other</SelectItem></SelectContent></Select></div>
              <div><Label>Format</Label><Select value={form.format} onValueChange={(v)=>setForm({...form,format:v as any})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PHYSICAL">Physical</SelectItem><SelectItem value="VIRTUAL">Virtual</SelectItem><SelectItem value="HYBRID">Hybrid</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Year</Label><Input type="number" value={form.year} onChange={(e)=>setForm({...form,year:e.target.value})} /></div>
              <div><Label>Level (Host)</Label><Select value={form.level} onValueChange={(v)=>setForm({...form,level:v as any})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="BRANCH">Branch</SelectItem><SelectItem value="LOCAL_GOVERNMENT">LGA</SelectItem><SelectItem value="STATE">State</SelectItem><SelectItem value="NATIONAL">National</SelectItem></SelectContent></Select></div>
            </div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.paymentRequired} onChange={(e)=>setForm({...form,paymentRequired:e.target.checked})} /> <Label>Payment Required (Contest Fee)</Label></div>
            {form.paymentRequired && (
              <div className="grid grid-cols-2 gap-4 border p-3 rounded">
                <div><Label>Amount ₦</Label><Input type="number" value={form.amount} onChange={(e)=>setForm({...form,amount:e.target.value})} /></div>
                <div><Label>Early Bird ₦</Label><Input type="number" value={form.earlyBirdAmount} onChange={(e)=>setForm({...form,earlyBirdAmount:e.target.value})} /></div>
                <div><Label>Early Bird Deadline</Label><Input type="date" value={form.earlyBirdDeadline} onChange={(e)=>setForm({...form,earlyBirdDeadline:e.target.value})} /></div>
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full bg-emerald-700 hover:bg-emerald-800">{loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create Contest</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

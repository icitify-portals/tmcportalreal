"use client";

import { useState, useEffect } from "react";
import { submitScore, completeCall } from "@/lib/actions/contests";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Send, CheckCircle } from "lucide-react";

const CRITERIA_LIBRARY: Record<string, { label: string; max: number }[]> = {
  QURAN: [
    { label: "Tajweed [تلاوة]", max: 10 },
    { label: "Hifz / Accuracy [حفظ]", max: 10 },
    { label: "Fluency & Makhraj", max: 10 },
    { label: "Presence & Adab", max: 5 },
  ],
  DEBATE: [
    { label: "Content & Argument", max: 10 },
    { label: "Delivery & Voice", max: 10 },
    { label: "Rebuttal", max: 10 },
    { label: "Etiquette", max: 5 },
  ],
  WRITTEN: [
    { label: "Content Depth", max: 10 },
    { label: "Structure", max: 10 },
    { label: "Language & Clarity", max: 10 },
  ],
  OTHER: [
    { label: "Accuracy", max: 10 },
    { label: "Delivery", max: 10 },
    { label: "Creativity", max: 10 },
  ],
};

export function ScoreCard({ callId, category }: { callId: string; category: string }) {
  const criteria = CRITERIA_LIBRARY[category] || CRITERIA_LIBRARY.OTHER;
  const [values, setValues] = useState<number[]>(criteria.map(() => 0));
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const total = values.reduce((a, b) => a + b, 0);
  const max = criteria.reduce((a, c) => a + c.max, 0);

  async function onSubmit() {
    setLoading(true);
    try {
      const obj: Record<string, number> = {};
      criteria.forEach((c, i) => { obj[c.label] = values[i]; });
      const res = await submitScore(callId, obj, comment || undefined);
      if (res.success) { setDone(true); toast.success(`Score submitted — ${res.total}/${max}`); }
      else toast.error(res.error || "Failed");
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  if (done) return (
    <div className="p-6 text-center rounded-lg border border-emerald-200 bg-emerald-50">
      <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
      <p className="font-semibold text-emerald-800">Score submitted ({total}/{max}). Awaiting other judges.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-sm">Judge Score Card ({category})</h4>
        <span className="text-xs font-bold text-muted-foreground">{total}/{max}</span>
      </div>
      {criteria.map((c, i) => (
        <div key={c.label} className="space-y-1">
          <div className="flex justify-between text-xs font-medium">
            <span>{c.label}</span><span className="text-muted-foreground">{values[i]}/{c.max}</span>
          </div>
          <Slider min={0} max={c.max} step={1} value={[values[i]]} onValueChange={(v) => setValues((p) => p.map((x, j) => (j === i ? v[0] : x)))} />
        </div>
      ))}
      <Textarea placeholder="Comment (optional)…" value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
      <Button onClick={onSubmit} disabled={loading} className="w-full bg-emerald-700 hover:bg-emerald-800">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}Submit Score</Button>
    </div>
  );
}

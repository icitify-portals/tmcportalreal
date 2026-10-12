"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function RollupStats({ summary }: { summary: any }) {
  const items = [
    { label: "Programmes", value: summary.totalProgrammes, sub: `${summary.completed} completed` },
    { label: "Attendees", value: summary.totalAttendees, sub: `${summary.totalMale}M / ${summary.totalFemale}F` },
    { label: "Avg / event", value: summary.avgAttendance, sub: "attendees (completed)" },
    { label: "Amount Spent", value: `₦${Number(summary.totalSpent).toLocaleString()}`, sub: `Budget ₦${Number(summary.totalBudget).toLocaleString()}` },
    { label: "Approved", value: summary.approved, sub: `${summary.pending} pending` },
    { label: "Rejected", value: summary.rejected, sub: `${summary.completed} done` },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((it) => (
        <Card key={it.label} className="border-emerald-200/90 bg-white hover:border-emerald-400 shadow-sm transition-all">
          <CardHeader className="pb-1 pt-3.5 px-3.5">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-900">{it.label}</CardTitle>
          </CardHeader>
          <CardContent className="px-3.5 pb-3.5">
            <div className="text-2xl font-extrabold text-slate-950">{it.value}</div>
            <div className="text-xs font-semibold text-slate-600 mt-0.5">{it.sub}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

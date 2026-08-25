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
        <Card key={it.label} className="border-green-800/20 bg-gradient-to-br from-white to-emerald-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">{it.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{it.value}</div>
            <div className="text-xs text-muted-foreground">{it.sub}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

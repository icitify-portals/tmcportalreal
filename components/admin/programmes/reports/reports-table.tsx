"use client";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

function StatusBadge({ s }: { s: string }) {
  const map: any = { COMPLETED: "bg-blue-600", APPROVED: "bg-green-600", PENDING_STATE: "bg-yellow-600", PENDING_NATIONAL: "bg-orange-600", REJECTED: "bg-red-600" };
  return <Badge className={`${map[s] ?? "bg-gray-600"} text-white`}>{s.replace("_", " ")}</Badge>;
}

export function ReportsTable({ details }: { details: any[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q) return details;
    const l = q.toLowerCase();
    return details.filter((d) => `${d.title} ${d.organizationName} ${d.officeName} ${d.officialName ?? ""}`.toLowerCase().includes(l));
  }, [q, details]);

  return (
    <div className="border border-slate-200/90 rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="p-3.5 flex items-center justify-between gap-2 bg-slate-50/50 border-b border-slate-200">
        <Input placeholder="Search title, jurisdiction, office, officer..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md bg-white border-slate-300 font-medium text-slate-900 placeholder:text-slate-400" />
        <div className="text-xs font-bold text-slate-700">{filtered.length} / {details.length}</div>
      </div>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-100/80 hover:bg-slate-100/80">
              <TableHead className="font-bold text-slate-900">Date</TableHead>
              <TableHead className="font-bold text-slate-900">Programme</TableHead>
              <TableHead className="font-bold text-slate-900">Jurisdiction</TableHead>
              <TableHead className="font-bold text-slate-900">Office</TableHead>
              <TableHead className="font-bold text-slate-900">Officer</TableHead>
              <TableHead className="font-bold text-slate-900">Status</TableHead>
              <TableHead className="text-right font-bold text-slate-900">Attendees</TableHead>
              <TableHead className="text-right font-bold text-slate-900">Spent</TableHead>
              <TableHead className="font-bold text-slate-900">Report</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center text-slate-600 font-medium py-8">No programmes in this period</TableCell></TableRow>
            ) : filtered.map((d) => (
              <TableRow key={d.id} className="hover:bg-slate-50/80">
                <TableCell className="text-xs font-semibold text-slate-800 whitespace-nowrap">{format(new Date(d.startDate), "dd MMM yyyy")}</TableCell>
                <TableCell>
                  <div className="font-bold text-sm text-slate-950 leading-tight">{d.title}</div>
                  <div className="text-xs font-medium text-slate-600">{d.venue} • {d.level}</div>
                </TableCell>
                <TableCell className="text-xs font-medium text-slate-800">{d.organizationName}</TableCell>
                <TableCell className="text-xs font-medium text-slate-800">{d.officeName}</TableCell>
                <TableCell className="text-xs font-medium text-slate-800">{d.officialName ?? "—"}</TableCell>
                <TableCell><StatusBadge s={d.status} /></TableCell>
                <TableCell className="text-right text-xs font-bold text-slate-900">{d.report ? `${d.report.attendeesMale + d.report.attendeesFemale} (${d.report.attendeesMale}M/${d.report.attendeesFemale}F)` : "—"}</TableCell>
                <TableCell className="text-right text-xs font-bold text-slate-900">{d.report ? `₦${Number(d.report.amountSpent).toLocaleString()}` : "—"}</TableCell>
                <TableCell className="text-xs font-semibold">{d.report ? <span className="text-emerald-700">Submitted {d.report.submittedByName ?? ""}</span> : <span className="text-amber-700">Pending</span>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

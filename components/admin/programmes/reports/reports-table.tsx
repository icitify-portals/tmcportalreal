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
    <div className="border rounded-xl bg-white">
      <div className="p-3 flex items-center justify-between gap-2">
        <Input placeholder="Search title, jurisdiction, office, officer..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />
        <div className="text-xs text-muted-foreground">{filtered.length} / {details.length}</div>
      </div>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Programme</TableHead>
              <TableHead>Jurisdiction</TableHead>
              <TableHead>Office</TableHead>
              <TableHead>Officer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Attendees</TableHead>
              <TableHead className="text-right">Spent</TableHead>
              <TableHead>Report</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No programmes in this period</TableCell></TableRow>
            ) : filtered.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="text-xs whitespace-nowrap">{format(new Date(d.startDate), "dd MMM yyyy")}</TableCell>
                <TableCell>
                  <div className="font-medium text-sm leading-tight">{d.title}</div>
                  <div className="text-xs text-muted-foreground">{d.venue} • {d.level}</div>
                </TableCell>
                <TableCell className="text-xs">{d.organizationName}</TableCell>
                <TableCell className="text-xs">{d.officeName}</TableCell>
                <TableCell className="text-xs">{d.officialName ?? "—"}</TableCell>
                <TableCell><StatusBadge s={d.status} /></TableCell>
                <TableCell className="text-right text-xs">{d.report ? `${d.report.attendeesMale + d.report.attendeesFemale} (${d.report.attendeesMale}M/${d.report.attendeesFemale}F)` : "—"}</TableCell>
                <TableCell className="text-right text-xs">{d.report ? `₦${Number(d.report.amountSpent).toLocaleString()}` : "—"}</TableCell>
                <TableCell className="text-xs">{d.report ? <span className="text-green-700">Submitted {d.report.submittedByName ?? ""}</span> : <span className="text-muted-foreground">Pending</span>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

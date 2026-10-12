"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { gradeColor } from "@/lib/grading";
import { format } from "date-fns";

export function LevelGrading({ data }: { data: any }) {
  if (!data) return <div className="text-sm font-medium text-slate-700 p-6 text-center border border-slate-200 rounded-xl bg-white shadow-sm">No grading data available for this period.</div>;
  const graded = data.graded || [];
  const byOrganization = data.byOrganization || [];
  const byLevel = data.byLevel || [];
  const overall = data.overall || { avgScore: 0, grade: "—", total: 0 };

  return (
    <div className="space-y-6">
      {/* Overall */}
      <Card className="border-emerald-300 bg-gradient-to-br from-emerald-50/90 to-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-emerald-950 uppercase tracking-wider">General Performance (Overall)</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className={`h-16 w-16 rounded-xl grid place-items-center text-white font-extrabold text-2xl shadow-md ${gradeColor(overall.grade || "—")}`}>{overall.grade || "—"}</div>
          <div>
            <div className="text-2xl font-black text-slate-950">{overall.avgScore ?? 0}/100</div>
            <div className="text-xs font-semibold text-slate-700 mt-0.5">{overall.total ?? 0} programmes graded • weighted by completion/punctuality/attendance/budget/quality</div>
            <Progress value={overall.avgScore ?? 0} className="h-2 mt-2 w-48 bg-slate-200" />
          </div>
        </CardContent>
      </Card>

      {/* By Level */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader><CardTitle className="text-sm font-bold text-slate-900">By Org Level</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {byLevel.length === 0 ? <div className="text-xs font-medium text-slate-500">No data</div> : byLevel.map((l: any) => (
              <div key={l.level} className="flex items-center justify-between border border-slate-200/90 rounded-lg px-3 py-2 bg-slate-50/60">
                <div>
                  <div className="font-bold text-sm text-slate-950">{l.level}</div>
                  <div className="text-xs font-medium text-slate-600">{l.count} programmes • avg {l.avgScore}</div>
                </div>
                <Badge className={`${gradeColor(l.grade)} text-white font-bold`}>{l.grade} • {l.avgScore}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader><CardTitle className="text-sm font-bold text-slate-900">By Jurisdiction</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-72 overflow-auto">
            {byOrganization.length === 0 ? <div className="text-xs font-medium text-slate-500">No data</div> : byOrganization.map((o: any) => (
              <div key={o.orgId} className="flex items-center justify-between border border-slate-200/90 rounded-lg px-3 py-2 bg-white">
                <div>
                  <div className="font-bold text-sm text-slate-950">{o.orgName} <span className="text-xs font-semibold text-emerald-800">• {o.level}</span></div>
                  <div className="text-xs font-medium text-slate-600">{o.count} programmes • avg {o.avgScore}</div>
                  <Progress value={o.avgScore} className="h-1.5 mt-1 bg-slate-200" />
                </div>
                <Badge className={`${gradeColor(o.grade)} text-white font-bold`}>{o.grade}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Per programme */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader><CardTitle className="text-sm font-bold text-slate-900">Per-Programme Grading — Programme Basis</CardTitle></CardHeader>
        <CardContent className="overflow-auto p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100/80 hover:bg-slate-100/80">
                <TableHead className="font-bold text-slate-900">Date</TableHead>
                <TableHead className="font-bold text-slate-900">Programme</TableHead>
                <TableHead className="font-bold text-slate-900">Jurisdiction</TableHead>
                <TableHead className="font-bold text-slate-900">Score</TableHead>
                <TableHead className="font-bold text-slate-900">Grade</TableHead>
                <TableHead className="font-bold text-slate-900">Breakdown</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {graded.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-slate-600 font-medium py-8">No programmes to grade</TableCell></TableRow> :
                graded.map((g: any) => (
                  <TableRow key={g.id} className="hover:bg-slate-50/80">
                    <TableCell className="text-xs font-semibold text-slate-800 whitespace-nowrap">{format(new Date(g.startDate), "dd MMM yy")}</TableCell>
                    <TableCell>
                      <div className="font-bold text-sm text-slate-950">{g.title}</div>
                      <div className="text-xs font-medium text-slate-600">{g.status}</div>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-800">{g.organizationName ?? g.level}</TableCell>
                    <TableCell className="font-extrabold text-slate-950">{g.weightedScore ?? g.score}</TableCell>
                    <TableCell><Badge className={`${gradeColor(g.grade)} text-white font-bold`}>{g.grade}</Badge></TableCell>
                    <TableCell className="text-[11px] font-semibold text-slate-700 min-w-[180px]">
                      <div className="grid grid-cols-5 gap-1">
                        <span className="bg-slate-100 px-1 py-0.5 rounded text-center" title={`Completion ${g.breakdown.completion}`}>C:{g.breakdown.completion}</span>
                        <span className="bg-slate-100 px-1 py-0.5 rounded text-center" title={`Punctuality ${g.breakdown.punctuality}`}>P:{g.breakdown.punctuality}</span>
                        <span className="bg-slate-100 px-1 py-0.5 rounded text-center" title={`Attendance ${g.breakdown.attendance}`}>A:{g.breakdown.attendance}</span>
                        <span className="bg-slate-100 px-1 py-0.5 rounded text-center" title={`Budget ${g.breakdown.budgetDiscipline}`}>B:{g.breakdown.budgetDiscipline}</span>
                        <span className="bg-slate-100 px-1 py-0.5 rounded text-center" title={`Quality ${g.breakdown.quality}`}>Q:{g.breakdown.quality}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="text-xs font-medium text-slate-800 rounded-xl border border-emerald-200 p-3.5 bg-emerald-50/60 shadow-sm leading-relaxed">
        <b className="text-emerald-950 font-bold">How grading works:</b> Completion 30% (COMPLETED=100, APPROVED=60, PENDING=30), Punctuality 20% (submitted ≤1d after end=100 → ≤14d=30, lateSubmission=40), Attendance 25% (actual vs 80 baseline), Budget discipline 15% (variance ≤15%=100), Quality 10% (summary + lecturers/topic + images). Weights tunable in <code className="bg-emerald-100 text-emerald-950 px-1 rounded">lib/grading.ts:DEFAULT_WEIGHTS</code>.
      </div>
    </div>
  );
}

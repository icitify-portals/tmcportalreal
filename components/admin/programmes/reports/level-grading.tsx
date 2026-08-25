"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { gradeColor } from "@/lib/grading";
import { format } from "date-fns";

export function LevelGrading({ data }: { data: any }) {
  if (!data) return <div className="text-sm text-muted-foreground">No grading data</div>;
  const { graded, byOrganization, byLevel, overall } = data;

  return (
    <div className="space-y-6">
      {/* Overall */}
      <Card className="border-emerald-800/30 bg-gradient-to-br from-emerald-50 to-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">General Performance (Overall)</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className={`h-16 w-16 rounded-xl grid place-items-center text-white font-extrabold text-2xl ${gradeColor(overall.grade)}`}>{overall.grade}</div>
          <div>
            <div className="text-2xl font-bold">{overall.avgScore}/100</div>
            <div className="text-xs text-muted-foreground">{overall.total} programmes graded • weighted by completion/punctuality/attendance/budget/quality</div>
            <Progress value={overall.avgScore} className="h-2 mt-2 w-48" />
          </div>
        </CardContent>
      </Card>

      {/* By Level */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">By Org Level</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {byLevel.length === 0 ? <div className="text-xs text-muted-foreground">No data</div> : byLevel.map((l: any) => (
              <div key={l.level} className="flex items-center justify-between border rounded-lg px-3 py-2">
                <div>
                  <div className="font-medium text-sm">{l.level}</div>
                  <div className="text-xs text-muted-foreground">{l.count} programmes • avg {l.avgScore}</div>
                </div>
                <Badge className={`${gradeColor(l.grade)} text-white`}>{l.grade} • {l.avgScore}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">By Jurisdiction</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-72 overflow-auto">
            {byOrganization.length === 0 ? <div className="text-xs text-muted-foreground">No data</div> : byOrganization.map((o: any) => (
              <div key={o.orgId} className="flex items-center justify-between border rounded-lg px-3 py-2 bg-white">
                <div>
                  <div className="font-medium text-sm">{o.orgName} <span className="text-xs text-muted-foreground">• {o.level}</span></div>
                  <div className="text-xs text-muted-foreground">{o.count} programmes • avg {o.avgScore}</div>
                  <Progress value={o.avgScore} className="h-1.5 mt-1" />
                </div>
                <Badge className={`${gradeColor(o.grade)} text-white`}>{o.grade}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Per programme */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Per-Programme Grading — Programme Basis</CardTitle></CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Programme</TableHead>
                <TableHead>Jurisdiction</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Breakdown</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {graded.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No programmes to grade</TableCell></TableRow> :
                graded.map((g: any) => (
                  <TableRow key={g.id}>
                    <TableCell className="text-xs whitespace-nowrap">{format(new Date(g.startDate), "dd MMM yy")}</TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{g.title}</div>
                      <div className="text-xs text-muted-foreground">{g.status}</div>
                    </TableCell>
                    <TableCell className="text-xs">{g.organizationName ?? g.level}</TableCell>
                    <TableCell className="font-bold">{g.weightedScore ?? g.score}</TableCell>
                    <TableCell><Badge className={`${gradeColor(g.grade)} text-white`}>{g.grade}</Badge></TableCell>
                    <TableCell className="text-[11px] min-w-[180px]">
                      <div className="grid grid-cols-5 gap-1">
                        <span title={`Completion ${g.breakdown.completion}`}>C:{g.breakdown.completion}</span>
                        <span title={`Punctuality ${g.breakdown.punctuality}`}>P:{g.breakdown.punctuality}</span>
                        <span title={`Attendance ${g.breakdown.attendance}`}>A:{g.breakdown.attendance}</span>
                        <span title={`Budget ${g.breakdown.budgetDiscipline}`}>B:{g.breakdown.budgetDiscipline}</span>
                        <span title={`Quality ${g.breakdown.quality}`}>Q:{g.breakdown.quality}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground rounded-xl border p-3 bg-muted/30">
        <b>How grading works:</b> Completion 30% (COMPLETED=100, APPROVED=60, PENDING=30), Punctuality 20% (submitted ≤1d after end=100 → ≤14d=30, lateSubmission=40), Attendance 25% (actual vs 80 baseline), Budget discipline 15% (variance ≤15%=100), Quality 10% (summary + lecturers/topic + images). Weights tunable in <code>lib/grading.ts:DEFAULT_WEIGHTS</code>.
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Layers } from "lucide-react";

const LEVEL_ORDER = ["NATIONAL", "STATE", "LOCAL_GOVERNMENT", "BRANCH", "UNKNOWN"];

const LEVEL_LABELS: Record<string, string> = {
  NATIONAL: "National",
  STATE: "State",
  LOCAL_GOVERNMENT: "LGA",
  BRANCH: "Branch",
  UNKNOWN: "Unspecified",
};

export function RegistrationAnalytics({ data }: { data: { totalRegistrations: number; totalAttended: number; byLevel: any[]; byStatus: any[] } }) {
  const levels = [...data.byLevel].sort(
    (a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level)
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-emerald-200 shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-emerald-700" />
              <div>
                <div className="text-2xl font-black text-slate-950">{data.totalRegistrations}</div>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Total Registrations</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-blue-700" />
              <div>
                <div className="text-2xl font-black text-slate-950">{data.totalAttended}</div>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Attended</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Layers className="h-8 w-8 text-purple-700" />
              <div>
                <div className="text-2xl font-black text-slate-950">{data.byLevel.length}</div>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Levels Represented</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader><CardTitle className="text-sm font-bold text-slate-900">Registrations by Level</CardTitle></CardHeader>
        <CardContent>
          {levels.length === 0 ? (
            <div className="text-sm font-medium text-slate-600">No registrations in this period.</div>
          ) : (
            <div className="space-y-3">
              {levels.map((l) => {
                const pct = data.totalRegistrations > 0 ? Math.round((l.total / data.totalRegistrations) * 100) : 0;
                return (
                  <div key={l.level} className="space-y-1.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-900">{LEVEL_LABELS[l.level] || l.level}</span>
                      <span className="text-xs font-semibold text-slate-700">
                        {l.total} registered • <span className="text-emerald-700 font-bold">{l.paid} paid</span> • {l.attended} attended ({pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 transition-all duration-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader><CardTitle className="text-sm font-bold text-slate-900">Registrations by Status</CardTitle></CardHeader>
        <CardContent>
          {data.byStatus.length === 0 ? (
            <div className="text-sm font-medium text-slate-600">No data.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.byStatus.map((s) => (
                <Badge key={s.status} variant="outline" className="text-xs font-bold text-slate-900 border-slate-300 bg-slate-50 px-2.5 py-1">
                  {s.status}: {s.count}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

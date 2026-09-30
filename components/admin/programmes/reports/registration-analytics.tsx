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
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-emerald-600" />
              <div>
                <div className="text-2xl font-bold">{data.totalRegistrations}</div>
                <div className="text-xs text-muted-foreground">Total Registrations</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{data.totalAttended}</div>
                <div className="text-xs text-muted-foreground">Attended</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Layers className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{data.byLevel.length}</div>
                <div className="text-xs text-muted-foreground">Levels Represented</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Registrations by Level</CardTitle></CardHeader>
        <CardContent>
          {levels.length === 0 ? (
            <div className="text-sm text-muted-foreground">No registrations in this period.</div>
          ) : (
            <div className="space-y-2">
              {levels.map((l) => {
                const pct = data.totalRegistrations > 0 ? Math.round((l.total / data.totalRegistrations) * 100) : 0;
                return (
                  <div key={l.level} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{LEVEL_LABELS[l.level] || l.level}</span>
                      <span className="text-muted-foreground">
                        {l.total} registered • {l.paid} paid • {l.attended} attended ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Registrations by Status</CardTitle></CardHeader>
        <CardContent>
          {data.byStatus.length === 0 ? (
            <div className="text-sm text-muted-foreground">No data.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.byStatus.map((s) => (
                <Badge key={s.status} variant="outline" className="text-xs">
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

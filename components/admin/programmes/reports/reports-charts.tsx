"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#0a7a3a", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444", "#10b981", "#6366f1"];

export function ReportsCharts({ byPeriod, byOffice, byLevel, byOrganization }: { byPeriod: any[]; byOffice: any[]; byLevel: any[]; byOrganization: any[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">Programmes & Attendees by Period</CardTitle></CardHeader>
        <CardContent className="h-72">
          {byPeriod.length === 0 ? <div className="h-full grid place-items-center text-muted-foreground text-sm">No data for period</div> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPeriod}>
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Programmes" fill="#0a7a3a" radius={[6,6,0,0]} />
                <Bar dataKey="completed" name="Completed" fill="#10b981" />
                <Bar dataKey="attendees" name="Attendees" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Spend Trend (₦)</CardTitle></CardHeader>
        <CardContent className="h-72">
          {byPeriod.length === 0 ? <div className="h-full grid place-items-center text-muted-foreground text-sm">No data</div> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPeriod}>
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => `₦${Number(v).toLocaleString()}`} />
                <Bar dataKey="spent" name="Spent" fill="#f59e0b" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">By Office (includes submitted reports)</CardTitle></CardHeader>
        <CardContent className="h-72">
          {byOffice.length === 0 ? <div className="h-full grid place-items-center text-muted-foreground text-sm">No office data</div> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byOffice.slice(0, 8)} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="officeName" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Programmes" fill="#0a7a3a" />
                <Bar dataKey="completed" name="Completed" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">By Org Level</CardTitle></CardHeader>
        <CardContent className="h-72 flex items-center justify-center">
          {byLevel.length === 0 ? <span className="text-muted-foreground text-sm">No data</span> : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byLevel} dataKey="count" nameKey="level" cx="50%" cy="50%" outerRadius={90} label={(props: any) => `${props.level}: ${props.count}`}>
                  {byLevel.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-sm">By Jurisdiction (drill-down: national sees all)</CardTitle></CardHeader>
        <CardContent className="h-80 overflow-auto">
          {byOrganization.length === 0 ? <div className="text-muted-foreground text-sm">No jurisdiction data</div> : (
            <div className="space-y-2">
              {byOrganization.slice(0, 20).map((o: any) => (
                <div key={o.orgId} className="flex items-center justify-between border rounded-lg px-3 py-2 bg-white">
                  <div>
                    <div className="font-medium text-sm">{o.orgName} <span className="text-xs text-muted-foreground">• {o.level}</span></div>
                    <div className="text-xs text-muted-foreground">{o.count} programmes • {o.completed} completed • {o.attendees} attendees • ₦{Number(o.spent).toLocaleString()} spent</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs">Completion {(o.count ? (o.completed / o.count) * 100 : 0).toFixed(0)}%</div>
                    <div className="h-2 w-24 bg-muted rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-green-600" style={{ width: `${o.count ? (o.completed / o.count) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#0a7a3a", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444", "#10b981", "#6366f1"];

export function ReportsCharts({ byPeriod, byOffice, byLevel, byOrganization }: { byPeriod: any[]; byOffice: any[]; byLevel: any[]; byOrganization: any[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader><CardTitle className="text-sm font-bold text-slate-900">Programmes & Attendees by Period</CardTitle></CardHeader>
        <CardContent className="h-72">
          {byPeriod.length === 0 ? <div className="h-full grid place-items-center text-slate-500 font-medium text-sm">No data for period</div> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPeriod}>
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#334155" }} />
                <YAxis tick={{ fontSize: 11, fill: "#334155" }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Programmes" fill="#047857" radius={[6,6,0,0]} />
                <Bar dataKey="completed" name="Completed" fill="#10b981" />
                <Bar dataKey="attendees" name="Attendees" fill="#0284c7" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader><CardTitle className="text-sm font-bold text-slate-900">Spend Trend (₦)</CardTitle></CardHeader>
        <CardContent className="h-72">
          {byPeriod.length === 0 ? <div className="h-full grid place-items-center text-slate-500 font-medium text-sm">No data</div> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPeriod}>
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#334155" }} />
                <YAxis tick={{ fontSize: 11, fill: "#334155" }} />
                <Tooltip formatter={(v: any) => `₦${Number(v).toLocaleString()}`} />
                <Bar dataKey="spent" name="Spent" fill="#d97706" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader><CardTitle className="text-sm font-bold text-slate-900">By Office (includes submitted reports)</CardTitle></CardHeader>
        <CardContent className="h-72">
          {byOffice.length === 0 ? <div className="h-full grid place-items-center text-slate-500 font-medium text-sm">No office data</div> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byOffice.slice(0, 8)} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11, fill: "#334155" }} />
                <YAxis dataKey="officeName" type="category" width={120} tick={{ fontSize: 11, fill: "#1e293b", fontWeight: 500 }} />
                <Tooltip />
                <Bar dataKey="count" name="Programmes" fill="#047857" />
                <Bar dataKey="completed" name="Completed" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader><CardTitle className="text-sm font-bold text-slate-900">By Org Level</CardTitle></CardHeader>
        <CardContent>
          {byLevel.length === 0 ? <span className="text-slate-500 font-medium text-sm">No data</span> : (
            <>
              <div className="h-56 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byLevel} dataKey="count" nameKey="level" cx="50%" cy="50%" outerRadius={75} label={(props: any) => `${props.level}: ${props.count}`}>
                      {byLevel.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {byLevel.map((l: any) => (
                  <div key={l.level} className="flex items-center justify-between text-xs border-t border-slate-100 pt-1.5">
                    <span className="font-bold text-slate-900">{l.level}</span>
                    <span className="text-slate-700 font-medium">
                      {l.count} programmes • <span className="text-emerald-700 font-semibold">{l.completed} completed</span> • {l.attendees} attendees • ₦{Number(l.spent).toLocaleString()} spent
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 border-slate-200 shadow-sm bg-white">
        <CardHeader><CardTitle className="text-sm font-bold text-slate-900">By Jurisdiction (drill-down: national sees all)</CardTitle></CardHeader>
        <CardContent className="h-80 overflow-auto">
          {byOrganization.length === 0 ? <div className="text-slate-500 font-medium text-sm">No jurisdiction data</div> : (
            <div className="space-y-2">
              {byOrganization.slice(0, 20).map((o: any) => (
                <div key={o.orgId} className="flex items-center justify-between border border-slate-200/80 rounded-lg px-3 py-2 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="font-bold text-slate-950 text-sm">{o.orgName} <span className="text-xs font-semibold text-emerald-800">• {o.level}</span></div>
                    <div className="text-xs font-medium text-slate-700 mt-0.5">{o.count} programmes • <span className="text-emerald-700 font-semibold">{o.completed} completed</span> • {o.attendees} attendees • ₦{Number(o.spent).toLocaleString()} spent</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">Completion {(o.count ? (o.completed / o.count) * 100 : 0).toFixed(0)}%</div>
                    <div className="h-2 w-24 bg-slate-200 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-emerald-600" style={{ width: `${o.count ? (o.completed / o.count) * 100 : 0}%` }} />
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

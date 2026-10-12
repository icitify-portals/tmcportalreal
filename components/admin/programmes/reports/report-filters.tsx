"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MONTH_NAMES } from "@/lib/report-period";

export function ReportFilters({
  scope,
  year,
  quarter,
  month,
  officeId,
  targetOrgId,
  years,
  offices,
  jurisdictions,
  currentOrgName,
}: {
  scope: string;
  year: number;
  quarter?: number;
  month?: number;
  officeId?: string;
  targetOrgId?: string;
  years: number[];
  offices: { id: string; name: string }[];
  jurisdictions: { id: string; name: string; level: string }[];
  currentOrgName: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value === "__all__" || value === "") params.delete(key);
    else params.set(key, value);
    // reset dependent
    if (key === "scope") {
      params.delete("quarter");
      params.delete("month");
    }
    router.push(`?${params.toString()}`);
  }

  const yearOptions = years.length ? years : [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 p-4 border border-slate-200/90 rounded-xl bg-white shadow-sm">
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-slate-900">Scope</Label>
        <Select value={scope} onValueChange={(v) => update("scope", v)}>
          <SelectTrigger className="border-slate-300 font-semibold text-slate-900 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly" className="font-medium text-slate-900">Monthly</SelectItem>
            <SelectItem value="quarterly" className="font-medium text-slate-900">Quarterly</SelectItem>
            <SelectItem value="annual" className="font-medium text-slate-900">Annual</SelectItem>
            <SelectItem value="ytd" className="font-medium text-slate-900">YTD</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-slate-900">Year</Label>
        <Select value={String(year)} onValueChange={(v) => update("year", v)}>
          <SelectTrigger className="border-slate-300 font-semibold text-slate-900 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            {yearOptions.map((y) => (
              <SelectItem key={y} value={String(y)} className="font-medium text-slate-900">{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {scope === "quarterly" && (
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-900">Quarter</Label>
          <Select value={quarter ? String(quarter) : "__all__"} onValueChange={(v) => update("quarter", v)}>
            <SelectTrigger className="border-slate-300 font-semibold text-slate-900 bg-white"><SelectValue placeholder="All quarters" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__" className="font-medium text-slate-900">All</SelectItem>
              <SelectItem value="1" className="font-medium text-slate-900">Q1 (Jan-Mar)</SelectItem>
              <SelectItem value="2" className="font-medium text-slate-900">Q2 (Apr-Jun)</SelectItem>
              <SelectItem value="3" className="font-medium text-slate-900">Q3 (Jul-Sep)</SelectItem>
              <SelectItem value="4" className="font-medium text-slate-900">Q4 (Oct-Dec)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      {scope === "monthly" && (
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-900">Month</Label>
          <Select value={month ? String(month) : "__all__"} onValueChange={(v) => update("month", v)}>
            <SelectTrigger className="border-slate-300 font-semibold text-slate-900 bg-white"><SelectValue placeholder="All months" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__" className="font-medium text-slate-900">All</SelectItem>
              {MONTH_NAMES.map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)} className="font-medium text-slate-900">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-slate-900">Office</Label>
        <Select value={officeId || "__all__"} onValueChange={(v) => update("officeId", v)}>
          <SelectTrigger className="border-slate-300 font-semibold text-slate-900 bg-white"><SelectValue placeholder="All offices" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__" className="font-medium text-slate-900">All offices</SelectItem>
            {offices.map((o) => (
              <SelectItem key={o.id} value={o.id} className="font-medium text-slate-900">{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-slate-900">Jurisdiction</Label>
        <Select value={targetOrgId || "__all__"} onValueChange={(v) => update("targetOrgId", v)}>
          <SelectTrigger className="border-slate-300 font-semibold text-slate-900 bg-white"><SelectValue placeholder={currentOrgName} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__" className="font-medium text-slate-900">{currentOrgName} (and children)</SelectItem>
            {jurisdictions.map((j) => (
              <SelectItem key={j.id} value={j.id} className="font-medium text-slate-900">{j.name} • {j.level}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-end">
        <Button variant="outline" className="w-full border-slate-300 text-slate-800 font-semibold hover:bg-slate-100" onClick={() => router.push(`?scope=${scope}&year=${year}`)}>Reset</Button>
      </div>
    </div>
  );
}

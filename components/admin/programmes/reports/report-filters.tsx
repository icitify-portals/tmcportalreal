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
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 p-4 border rounded-xl bg-white">
      <div className="space-y-1">
        <Label>Scope</Label>
        <Select value={scope} onValueChange={(v) => update("scope", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="annual">Annual</SelectItem>
            <SelectItem value="ytd">YTD</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Year</Label>
        <Select value={String(year)} onValueChange={(v) => update("year", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {yearOptions.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {scope === "quarterly" && (
        <div className="space-y-1">
          <Label>Quarter</Label>
          <Select value={quarter ? String(quarter) : "__all__"} onValueChange={(v) => update("quarter", v)}>
            <SelectTrigger><SelectValue placeholder="All quarters" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              <SelectItem value="1">Q1 (Jan-Mar)</SelectItem>
              <SelectItem value="2">Q2 (Apr-Jun)</SelectItem>
              <SelectItem value="3">Q3 (Jul-Sep)</SelectItem>
              <SelectItem value="4">Q4 (Oct-Dec)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      {scope === "monthly" && (
        <div className="space-y-1">
          <Label>Month</Label>
          <Select value={month ? String(month) : "__all__"} onValueChange={(v) => update("month", v)}>
            <SelectTrigger><SelectValue placeholder="All months" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              {MONTH_NAMES.map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1">
        <Label>Office</Label>
        <Select value={officeId || "__all__"} onValueChange={(v) => update("officeId", v)}>
          <SelectTrigger><SelectValue placeholder="All offices" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All offices</SelectItem>
            {offices.map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Jurisdiction</Label>
        <Select value={targetOrgId || "__all__"} onValueChange={(v) => update("targetOrgId", v)}>
          <SelectTrigger><SelectValue placeholder={currentOrgName} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{currentOrgName} (and children)</SelectItem>
            {jurisdictions.map((j) => (
              <SelectItem key={j.id} value={j.id}>{j.name} • {j.level}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-end">
        <Button variant="outline" className="w-full" onClick={() => router.push(`?scope=${scope}&year=${year}`)}>Reset</Button>
      </div>
    </div>
  );
}

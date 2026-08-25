"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getOfficeRollup, generateQuarterlyReport, generateAnnualReport } from "@/lib/actions/reports";
import { Loader2 } from "lucide-react";

export function OfficeRollupGenerator({
  organizationId,
  offices,
  isNational,
}: {
  organizationId: string;
  offices: any[];
  isNational: boolean;
}) {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [quarter, setQuarter] = useState("1");
  const [officeId, setOfficeId] = useState("__all__");
  const [preview, setPreview] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  const years = Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - i));

  function loadPreview(q?: string) {
    const qNum = q ? parseInt(q) : undefined;
    startTransition(async () => {
      const res = await getOfficeRollup({
        organizationId,
        officeId: officeId === "__all__" ? undefined : officeId,
        year: parseInt(year),
        quarter: qNum,
        includeHierarchy: officeId === "__all__",
      });
      setPreview({ ...res, quarter: qNum });
    });
  }

  return (
    <Card className="border-emerald-800/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Generate Quarterly & Annual Reports</CardTitle>
        <p className="text-xs text-muted-foreground">
          Individual office: select office → quarterly aggregates its 3 monthly reports. National: select “All offices” → aggregates every office/jurisdiction (branch→LGA→State→National) at a click.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <Label className="text-xs">Year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Office Scope</Label>
            <Select value={officeId} onValueChange={setOfficeId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{isNational ? "National — All offices" : "My jurisdiction — All offices"}</SelectItem>
                {offices.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Quarter</Label>
            <Select value={quarter} onValueChange={setQuarter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Q1 (Jan-Mar)</SelectItem>
                <SelectItem value="2">Q2 (Apr-Jun)</SelectItem>
                <SelectItem value="3">Q3 (Jul-Sep)</SelectItem>
                <SelectItem value="4">Q4 (Oct-Dec)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" size="sm" onClick={() => loadPreview(quarter)} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Preview Q{quarter}
            </Button>
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" size="sm" onClick={() => loadPreview(undefined)} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Preview Year
            </Button>
          </div>
        </div>

        {preview && (
          <div className="rounded-lg border p-3 bg-muted/20 space-y-2">
            <div className="text-sm font-semibold">
              {preview.quarter ? `Q${preview.quarter} ${year}` : `Annual ${year}`} — {preview.total}/{preview.expected} monthly reports ({preview.coverage}% coverage) • {preview.approvedCount} approved
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {preview.byPeriod.map((p: any) => <span key={p.period} className="px-2 py-1 bg-white border rounded">{p.period}: {p.count}</span>)}
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {preview.byOffice.map((o: any) => <span key={o.name} className="px-2 py-1 bg-emerald-50 border border-emerald-200 rounded">{o.name}: {o.count}</span>)}
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800"
                onClick={() => startTransition(async () => {
                  const res = await generateQuarterlyReport({ organizationId, officeId: officeId === "__all__" ? undefined : officeId, year: parseInt(year), quarter: parseInt(quarter) });
                  if (res.success) toast.success(`Quarterly Q${quarter} generated`);
                  else toast.error(res.error || "Failed");
                })}
              >
                Generate Quarterly Q{quarter}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => startTransition(async () => {
                  const res = await generateAnnualReport({ organizationId, officeId: officeId === "__all__" ? undefined : officeId, year: parseInt(year) });
                  if (res.success) toast.success(`Annual ${year} generated`);
                  else toast.error(res.error || "Failed");
                })}
              >
                Generate Annual {year}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

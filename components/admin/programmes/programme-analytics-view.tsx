"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TrendingUp, Clock, DollarSign, MapPin, Building, ShieldCheck, Download, Search, X } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface RegistrationStat {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  gender?: string | null;
  state?: string | null;
  lga?: string | null;
  branch?: string | null;
  status: string | null;
  amountPaid: string | number | null;
  checkInTime: string | Date | null;
  bulkGroupId?: string | null;
  sponsorPoolId?: string | null;
}

export function ProgrammeAnalyticsView({
  programmeTitle,
  programmeStartDate,
  registrations,
}: {
  programmeTitle: string;
  programmeStartDate: string | Date;
  registrations: RegistrationStat[];
}) {
  const [query, setQuery] = useState("");

  const summary = useMemo(() => {
    const total = registrations.length;
    let paidCount = 0;
    let totalRevenue = 0;
    let attendedCount = 0;
    let maleCount = 0;
    let femaleCount = 0;
    let bulkCount = 0;
    let sponsorCount = 0;
    let directCount = 0;

    const stateMap: Record<string, { total: number; paid: number; attended: number; revenue: number }> = {};
    const lgaMap: Record<string, { total: number; paid: number; attended: number; state: string }> = {};
    const branchMap: Record<string, { total: number; paid: number; attended: number; state: string; lga: string }> = {};

    for (const r of registrations) {
      const isPaid = r.status === "PAID" || r.status === "ATTENDED";
      const isAttended = Boolean(r.checkInTime) || r.status === "ATTENDED";
      const amt = parseFloat(String(r.amountPaid || "0"));

      if (isPaid) {
        paidCount++;
        totalRevenue += amt;
      }
      if (isAttended) attendedCount++;

      const g = (r.gender || "").toUpperCase();
      if (g.startsWith("M") || g === "BROTHER") maleCount++;
      else if (g.startsWith("F") || g === "SISTER") femaleCount++;

      if (r.bulkGroupId) bulkCount++;
      else if (r.sponsorPoolId) sponsorCount++;
      else directCount++;

      const st = (r.state || "Unspecified").trim();
      const lg = (r.lga || "Unspecified").trim();
      const br = (r.branch || "Unspecified").trim();

      // State
      if (!stateMap[st]) stateMap[st] = { total: 0, paid: 0, attended: 0, revenue: 0 };
      stateMap[st].total++;
      if (isPaid) { stateMap[st].paid++; stateMap[st].revenue += amt; }
      if (isAttended) stateMap[st].attended++;

      // LGA
      if (!lgaMap[lg]) lgaMap[lg] = { total: 0, paid: 0, attended: 0, state: st };
      lgaMap[lg].total++;
      if (isPaid) lgaMap[lg].paid++;
      if (isAttended) lgaMap[lg].attended++;

      // Branch
      if (!branchMap[br]) branchMap[br] = { total: 0, paid: 0, attended: 0, state: st, lga: lg };
      branchMap[br].total++;
      if (isPaid) branchMap[br].paid++;
      if (isAttended) branchMap[br].attended++;
    }

    const statesList = Object.entries(stateMap).map(([name, s]) => ({ name, ...s })).sort((a, b) => b.total - a.total);
    const lgasList = Object.entries(lgaMap).map(([name, s]) => ({ name, ...s })).sort((a, b) => b.total - a.total);
    const branchesList = Object.entries(branchMap).map(([name, s]) => ({ name, ...s })).sort((a, b) => b.total - a.total);

    return {
      total,
      paidCount,
      totalRevenue,
      attendedCount,
      maleCount,
      femaleCount,
      bulkCount,
      sponsorCount,
      directCount,
      statesList,
      lgasList,
      branchesList,
    };
  }, [registrations]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${programmeTitle} — Registration Analytics`, 14, 18);
    doc.setFontSize(10);
    doc.text(`Total Registered: ${summary.total} | Paid: ${summary.paidCount} | Revenue: NGN ${summary.totalRevenue.toLocaleString()}`, 14, 26);

    const body = summary.statesList.map((s) => [
      s.name,
      s.total,
      s.paid,
      s.attended,
      `NGN ${s.revenue.toLocaleString()}`,
      `${summary.total > 0 ? ((s.total / summary.total) * 100).toFixed(1) : 0}%`,
    ]);

    autoTable(doc, {
      startY: 32,
      head: [["State Jurisdiction", "Registered", "Paid", "Attended", "Revenue", "% Share"]],
      body: body,
      headStyles: { fillColor: [22, 101, 52] },
    });

    doc.save(`${programmeTitle.replace(/\s+/g, "_")}_Analytics.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-green-950">Registration Analytics</h2>
          <p className="text-sm text-muted-foreground font-medium">
            {programmeTitle} &bull; Multi-level breakdown across States, LGAs, Branches, and Payment Modes.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportPDF}>
          <Download className="h-4 w-4 mr-1.5" /> Export PDF Summary
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50/50 border-blue-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-blue-800 flex items-center gap-1.5">
              <Users className="h-4 w-4" /> Total Registrations
            </CardDescription>
            <CardTitle className="text-3xl font-black text-blue-950">{summary.total}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-blue-700">
            {summary.paidCount} Paid &bull; {summary.total - summary.paidCount} Unpaid/Draft
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/50 border-emerald-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-emerald-800 flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" /> Total Revenue
            </CardDescription>
            <CardTitle className="text-3xl font-black text-emerald-950">{formatCurrency(summary.totalRevenue)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-emerald-700">
            {summary.total > 0 ? Math.round((summary.paidCount / summary.total) * 100) : 0}% Payment conversion
          </CardContent>
        </Card>

        <Card className="bg-purple-50/50 border-purple-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-purple-800 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" /> Attendance Count
            </CardDescription>
            <CardTitle className="text-3xl font-black text-purple-950">{summary.attendedCount}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-purple-700">
            {summary.total > 0 ? Math.round((summary.attendedCount / summary.total) * 100) : 0}% Check-in rate
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 border-amber-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-amber-800 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Demographics
            </CardDescription>
            <CardTitle className="text-2xl font-black text-amber-950">
              {summary.maleCount}M / {summary.femaleCount}F
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-amber-700">
            {summary.bulkCount} Bulk &bull; {summary.sponsorCount} Sponsored &bull; {summary.directCount} Direct
          </CardContent>
        </Card>
      </div>

      {/* Cadre Navigation Tabs */}
      <Tabs defaultValue="states" className="space-y-4">
        <TabsList>
          <TabsTrigger value="states">State Breakdown ({summary.statesList.length})</TabsTrigger>
          <TabsTrigger value="lgas">LGA Breakdown ({summary.lgasList.length})</TabsTrigger>
          <TabsTrigger value="branches">Branch Breakdown ({summary.branchesList.length})</TabsTrigger>
          <TabsTrigger value="modes">Registration Channels</TabsTrigger>
        </TabsList>

        {/* States Tab */}
        <TabsContent value="states" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.statesList.map((st) => {
              const pct = summary.total > 0 ? Math.round((st.total / summary.total) * 100) : 0;
              return (
                <Card key={st.name} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold text-emerald-950 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-emerald-700" /> {st.name}
                      </CardTitle>
                      <Badge variant="outline" className="font-bold">{st.total} registered ({pct}%)</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Progress value={pct} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <span>Paid: <b>{st.paid}</b> &bull; Attended: <b>{st.attended}</b></span>
                      <span className="font-bold text-emerald-700">{formatCurrency(st.revenue)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* LGAs Tab */}
        <TabsContent value="lgas" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {summary.lgasList.map((lg) => (
              <div key={lg.name} className="p-3 bg-white border rounded-xl shadow-sm flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-gray-900">{lg.name}</div>
                  <div className="text-xs text-muted-foreground">{lg.state}</div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-sm text-emerald-700">{lg.total}</div>
                  <div className="text-[10px] text-muted-foreground">{lg.paid} paid</div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Branches Tab */}
        <TabsContent value="branches" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {summary.branchesList.map((br) => (
              <div key={br.name} className="p-3 bg-white border rounded-xl shadow-sm flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-gray-900 flex items-center gap-1">
                    <Building className="h-3.5 w-3.5 text-emerald-700" /> {br.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{br.lga}, {br.state}</div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-sm text-emerald-700">{br.total}</div>
                  <div className="text-[10px] text-muted-foreground">{br.paid} paid</div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Modes Tab */}
        <TabsContent value="modes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">Direct Online Registrations</CardTitle>
                <CardDescription>Individual self-service registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-blue-700">{summary.directCount}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {summary.total > 0 ? Math.round((summary.directCount / summary.total) * 100) : 0}% of total
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">Bulk Delegations</CardTitle>
                <CardDescription>Branch & group representative payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-emerald-700">{summary.bulkCount}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {summary.total > 0 ? Math.round((summary.bulkCount / summary.total) * 100) : 0}% of total
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">Sponsorship Pool Claims</CardTitle>
                <CardDescription>Sponsored seat claims via token codes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-purple-700">{summary.sponsorCount}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {summary.total > 0 ? Math.round((summary.sponsorCount / summary.total) * 100) : 0}% of total
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

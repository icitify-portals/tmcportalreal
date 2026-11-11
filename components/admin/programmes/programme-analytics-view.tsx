"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  MapPin, 
  Building, 
  ShieldCheck, 
  Download, 
  Search, 
  X, 
  HeartHandshake,
  Receipt,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  ExternalLink,
  Share2
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { syncAllProgrammePayments } from "@/lib/actions/programmes";
import { toast } from "sonner";
import Link from "next/link";
import { ProgrammeShareTab } from "./programme-share-tab";

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
  lockedAmount?: string | number | null;
  paymentReference?: string | null;
  checkInTime: string | Date | null;
  bulkGroupId?: string | null;
  sponsorPoolId?: string | null;
}

export function ProgrammeAnalyticsView({
  programmeId,
  programmeTitle,
  programmeStartDate,
  programmeAmount = "0.00",
  registrations,
  sponsorshipPools = [],
  bulkGroups = [],
}: {
  programmeId?: string;
  programmeTitle: string;
  programmeStartDate: string | Date;
  programmeAmount?: string | number | null;
  registrations: RegistrationStat[];
  sponsorshipPools?: any[];
  bulkGroups?: any[];
}) {
  const [query, setQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncPayments = async () => {
    if (!programmeId) return;
    setIsSyncing(true);
    try {
      const res = await syncAllProgrammePayments(programmeId);
      if (res.success) {
        toast.success(res.message);
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to sync payments");
      }
    } catch (e) {
      toast.error("An error occurred during synchronization");
    } finally {
      setIsSyncing(false);
    }
  };

  const summary = useMemo(() => {
    const total = registrations.length;
    let paidCount = 0;
    let partialCount = 0;
    let attendedCount = 0;
    let maleCount = 0;
    let femaleCount = 0;
    let bulkCount = 0;
    let sponsorCount = 0;
    let directCount = 0;

    let directPaidRevenue = 0;
    let partialRevenue = 0;
    let totalDirectAttendeesPaid = 0;

    const stateMap: Record<string, { total: number; paid: number; attended: number; revenue: number }> = {};
    const lgaMap: Record<string, { total: number; paid: number; attended: number; state: string }> = {};
    const branchMap: Record<string, { total: number; paid: number; attended: number; state: string; lga: string }> = {};

    for (const r of registrations) {
      const amt = parseFloat(String(r.amountPaid || "0"));
      const isPaid = r.status === "PAID" || r.status === "ATTENDED";
      const isPartial = r.status === "PARTIALLY_PAID" || (!isPaid && amt > 0);
      const isAttended = Boolean(r.checkInTime) || r.status === "ATTENDED";

      if (isPaid) paidCount++;
      if (isPartial) partialCount++;
      if (isAttended) attendedCount++;

      // Distinguish direct self-paid from pool or bulk claims to avoid double counting
      if (!r.sponsorPoolId && !r.bulkGroupId) {
        if (isPaid) {
          directPaidRevenue += amt;
          totalDirectAttendeesPaid++;
        } else if (isPartial) {
          partialRevenue += amt;
        }
      }

      const g = (r.gender || "").toUpperCase();
      if (g.startsWith("M") || g === "BROTHER") maleCount++;
      else if (g.startsWith("F") || g === "SISTER") femaleCount++;

      if (r.bulkGroupId) bulkCount++;
      else if (r.sponsorPoolId) sponsorCount++;
      else directCount++;

      const st = (r.state || "Unspecified").trim();
      const lg = (r.lga || "Unspecified").trim();
      const br = (r.branch || "Unspecified").trim();

      // State breakdown
      if (!stateMap[st]) stateMap[st] = { total: 0, paid: 0, attended: 0, revenue: 0 };
      stateMap[st].total++;
      if (isPaid) { stateMap[st].paid++; stateMap[st].revenue += amt; }
      if (isAttended) stateMap[st].attended++;

      // LGA breakdown
      if (!lgaMap[lg]) lgaMap[lg] = { total: 0, paid: 0, attended: 0, state: st };
      lgaMap[lg].total++;
      if (isPaid) lgaMap[lg].paid++;
      if (isAttended) lgaMap[lg].attended++;

      // Branch breakdown
      if (!branchMap[br]) branchMap[br] = { total: 0, paid: 0, attended: 0, state: st, lga: lg };
      branchMap[br].total++;
      if (isPaid) branchMap[br].paid++;
      if (isAttended) branchMap[br].attended++;
    }

    // 2. Sponsorship Pools Revenue
    let poolsPaidRevenue = 0;
    let poolsTotalPledged = 0;
    let totalSponsorSeats = 0;
    let claimedSponsorSeats = 0;
    let paidPoolsCount = 0;

    for (const pool of sponsorshipPools) {
      const tot = parseFloat(String(pool.totalAmount || "0"));
      poolsTotalPledged += tot;
      if (pool.status === "PAID") {
        poolsPaidRevenue += tot;
        paidPoolsCount++;
      }
      totalSponsorSeats += pool.seatCount || 0;
      claimedSponsorSeats += pool.seatsClaimed || 0;
    }

    // 3. Bulk Groups Revenue
    let bulkPaidRevenue = 0;
    let bulkTotalInvoiced = 0;
    let totalBulkAttendees = 0;
    let paidBulkCount = 0;

    for (const bg of bulkGroups) {
      const tot = parseFloat(String(bg.totalAmount || "0"));
      bulkTotalInvoiced += tot;
      if (bg.status === "PAID") {
        bulkPaidRevenue += tot;
        paidBulkCount++;
      }
      totalBulkAttendees += bg.attendeeCount || 0;
    }

    // Combined Grand Total Revenue
    const grandTotalRevenue = directPaidRevenue + partialRevenue + poolsPaidRevenue + bulkPaidRevenue;

    const statesList = Object.entries(stateMap).map(([name, s]) => ({ name, ...s })).sort((a, b) => b.total - a.total);
    const lgasList = Object.entries(lgaMap).map(([name, s]) => ({ name, ...s })).sort((a, b) => b.total - a.total);
    const branchesList = Object.entries(branchMap).map(([name, s]) => ({ name, ...s })).sort((a, b) => b.total - a.total);

    return {
      total,
      paidCount,
      partialCount,
      attendedCount,
      maleCount,
      femaleCount,
      bulkCount,
      sponsorCount,
      directCount,
      // Comprehensive Finances
      grandTotalRevenue,
      directPaidRevenue,
      partialRevenue,
      totalDirectAttendeesPaid,
      poolsPaidRevenue,
      poolsTotalPledged,
      totalSponsorSeats,
      claimedSponsorSeats,
      paidPoolsCount,
      bulkPaidRevenue,
      bulkTotalInvoiced,
      totalBulkAttendees,
      paidBulkCount,
      statesList,
      lgasList,
      branchesList,
    };
  }, [registrations, sponsorshipPools, bulkGroups]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${programmeTitle} — Financial Audit & Registration Analytics`, 14, 18);
    doc.setFontSize(10);
    doc.text(
      `Grand Total Revenue: NGN ${summary.grandTotalRevenue.toLocaleString()} | Direct: NGN ${summary.directPaidRevenue.toLocaleString()} | Sponsors: NGN ${summary.poolsPaidRevenue.toLocaleString()} | Bulk: NGN ${summary.bulkPaidRevenue.toLocaleString()}`,
      14,
      26
    );

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

    doc.save(`${programmeTitle.replace(/\s+/g, "_")}_Financial_Analytics.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/dashboard/admin/programmes/${programmeId}/registrations`} className="text-xs text-emerald-700 hover:underline">
              ← Back to Registrations Menu
            </Link>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-green-950">Registration & Financial Analytics</h2>
          <p className="text-sm text-muted-foreground font-medium">
            {programmeTitle} &bull; Comprehensive audit of Direct Attendee Payments, Sponsorship Pools, and Bulk Delegations.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {programmeId && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSyncPayments} 
              disabled={isSyncing}
              className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 h-9"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Reconciling...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1.5 text-emerald-600" /> Reconcile Payments
                </>
              )}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={exportPDF} className="h-9">
            <Download className="h-4 w-4 mr-1.5" /> Export PDF Summary
          </Button>
        </div>
      </div>

      {/* Top Comprehensive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registrations */}
        <Card className="bg-blue-50/50 border-blue-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-blue-800 flex items-center gap-1.5">
              <Users className="h-4 w-4" /> Total Registrations
            </CardDescription>
            <CardTitle className="text-3xl font-black text-blue-950">{summary.total}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-blue-700">
            {summary.paidCount} Paid &bull; {summary.partialCount} Partial &bull; {summary.total - summary.paidCount - summary.partialCount} Unpaid
          </CardContent>
        </Card>

        {/* Grand Total Revenue */}
        <Card className="bg-emerald-50/70 border-emerald-300 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs uppercase font-bold text-emerald-800 flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-emerald-600" /> Grand Total Revenue
              </CardDescription>
              <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                All Channels
              </Badge>
            </div>
            <CardTitle className="text-3xl font-black text-emerald-950">
              {formatCurrency(summary.grandTotalRevenue)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-emerald-800 space-y-1">
            <div className="flex items-center justify-between">
              <span>Direct Attendees:</span>
              <span className="font-semibold">{formatCurrency(summary.directPaidRevenue + summary.partialRevenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Sponsorship Pools:</span>
              <span className="font-semibold">{formatCurrency(summary.poolsPaidRevenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Bulk Delegations:</span>
              <span className="font-semibold">{formatCurrency(summary.bulkPaidRevenue)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Count */}
        <Card className="bg-purple-50/50 border-purple-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-purple-800 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" /> Attendance / Check-In
            </CardDescription>
            <CardTitle className="text-3xl font-black text-purple-950">{summary.attendedCount}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-purple-700">
            {summary.total > 0 ? Math.round((summary.attendedCount / summary.total) * 100) : 0}% Check-in rate across registered
          </CardContent>
        </Card>

        {/* Channel Demographics */}
        <Card className="bg-amber-50/50 border-amber-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-amber-800 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Registration Modes
            </CardDescription>
            <CardTitle className="text-2xl font-black text-amber-950">
              {summary.directCount} Direct
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-amber-800 space-y-0.5">
            <div><strong>{summary.sponsorCount}</strong> Sponsored Seats Claimed</div>
            <div><strong>{summary.bulkCount}</strong> Bulk Seats Claimed</div>
            <div className="text-[11px] text-amber-700/90 pt-1">Gender: {summary.maleCount} Brothers &bull; {summary.femaleCount} Sisters</div>
          </CardContent>
        </Card>
      </div>

      {/* Cadre Navigation Tabs */}
      <Tabs defaultValue="financial-audit" className="space-y-4">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="financial-audit" className="font-bold text-slate-800 data-[state=active]:bg-emerald-700 data-[state=active]:text-white shadow-xs">
            <Receipt className="h-4 w-4 mr-1.5" />
            Financial Audit & Collections
          </TabsTrigger>
          <TabsTrigger value="states">State Breakdown ({summary.statesList.length})</TabsTrigger>
          <TabsTrigger value="lgas">LGA Breakdown ({summary.lgasList.length})</TabsTrigger>
          <TabsTrigger value="branches">Branch Breakdown ({summary.branchesList.length})</TabsTrigger>
          <TabsTrigger value="modes">Registration Channels</TabsTrigger>
          <TabsTrigger value="sponsorship">Sponsorship Pools ({sponsorshipPools.length})</TabsTrigger>
          <TabsTrigger value="shareable-link" className="font-bold text-slate-800 data-[state=active]:bg-emerald-700 data-[state=active]:text-white shadow-xs">
            <Share2 className="h-4 w-4 mr-1.5 text-emerald-600 data-[state=active]:text-white" />
            Shareable Registration Link & Publicity
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Comprehensive Financial Audit */}
        <TabsContent value="financial-audit" className="space-y-6">
          {/* Audit Summary Card */}
          <Card className="border border-emerald-200 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b bg-emerald-50/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg font-bold text-emerald-950 flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-emerald-600" />
                    Complete Financial Audit Summary
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Reconciliation of all revenue collected across Direct Registrations, Sponsorship Pools, and Bulk Delegations.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="border-emerald-600 text-emerald-800 bg-white font-bold text-xs self-start sm:self-auto">
                  Reconciled Total: {formatCurrency(summary.grandTotalRevenue)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              {/* Channel Summary Table */}
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b">
                    <tr>
                      <th className="py-2.5 px-4 text-left">Revenue Channel</th>
                      <th className="py-2.5 px-4 text-center">Volume / Records</th>
                      <th className="py-2.5 px-4 text-right">Collected (NGN)</th>
                      <th className="py-2.5 px-4 text-right">% Contribution</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">Direct Individual Registrations</div>
                        <div className="text-xs text-muted-foreground">Self-paid tickets by members and guests</div>
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-slate-700">
                        {summary.totalDirectAttendeesPaid} paid tickets
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-800">
                        {formatCurrency(summary.directPaidRevenue)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-600">
                        {summary.grandTotalRevenue > 0 ? ((summary.directPaidRevenue / summary.grandTotalRevenue) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className="bg-green-100 text-green-800 border-green-300 text-[10px]">Verified</Badge>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">Sponsorship Pools</div>
                        <div className="text-xs text-muted-foreground">
                          {summary.totalSponsorSeats} total seats sponsored ({summary.claimedSponsorSeats} claimed, {Math.max(0, summary.totalSponsorSeats - summary.claimedSponsorSeats)} available)
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-slate-700">
                        {summary.paidPoolsCount} paid donor pools
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-purple-800">
                        {formatCurrency(summary.poolsPaidRevenue)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-600">
                        {summary.grandTotalRevenue > 0 ? ((summary.poolsPaidRevenue / summary.grandTotalRevenue) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-[10px]">Paid Pools</Badge>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">Bulk Group Delegations</div>
                        <div className="text-xs text-muted-foreground">
                          Branch & LGA representative packages ({summary.totalBulkAttendees} delegate seats)
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-slate-700">
                        {summary.paidBulkCount} bulk packages
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-800">
                        {formatCurrency(summary.bulkPaidRevenue)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-600">
                        {summary.grandTotalRevenue > 0 ? ((summary.bulkPaidRevenue / summary.grandTotalRevenue) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-[10px]">Paid Groups</Badge>
                      </td>
                    </tr>

                    {summary.partialRevenue > 0 && (
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">Partially Paid Deposits</div>
                          <div className="text-xs text-muted-foreground">Installments paid towards registration fees</div>
                        </td>
                        <td className="py-3 px-4 text-center font-medium text-slate-700">
                          {summary.partialCount} deposits
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-amber-800">
                          {formatCurrency(summary.partialRevenue)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-600">
                          {summary.grandTotalRevenue > 0 ? ((summary.partialRevenue / summary.grandTotalRevenue) * 100).toFixed(1) : 0}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">Partial</Badge>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t">
                    <tr>
                      <td className="py-3.5 px-4 text-slate-900 font-extrabold uppercase text-xs">
                        Grand Total Verified Inflows
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-800">
                        {summary.total} Registrants
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-950 font-black text-base">
                        {formatCurrency(summary.grandTotalRevenue)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-900">100.0%</td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge className="bg-emerald-700 text-white font-bold text-[10px]">Audited</Badge>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Informative Explanation Note */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 text-xs text-emerald-900 leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-950">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  Why attendee list sums differ from Total Gateway Collection:
                </div>
                <p>
                  The Attendee Table only lists individuals who have registered their personal details. When philanthropists purchase <strong>Sponsorship Pools</strong> (e.g. ₦700k or ₦150k blocks) or chapters pay for <strong>Bulk Delegations</strong> upfront, those funds enter the gateway immediately, but individual rows are only added as attendees claim their seats with the sponsor code. The Grand Total Revenue above accounts for all verified inflows across every channel without omissions.
                </p>
              </div>

              {/* Bulk Groups Details Table */}
              {bulkGroups.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Layers className="h-4 w-4 text-blue-600" />
                      Bulk Group Delegations ({bulkGroups.length})
                    </h4>
                    <span className="text-xs text-muted-foreground font-medium">
                      Total Invoiced: {formatCurrency(summary.bulkTotalInvoiced)} &bull; Paid: {formatCurrency(summary.bulkPaidRevenue)}
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b">
                        <tr>
                          <th className="py-2 px-3 text-left">Paymaster / Entity</th>
                          <th className="py-2 px-3 text-center">Attendees</th>
                          <th className="py-2 px-3 text-right">Per Attendee</th>
                          <th className="py-2 px-3 text-right">Total Amount</th>
                          <th className="py-2 px-3 text-center">Payment Ref</th>
                          <th className="py-2 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bulkGroups.map((bg: any) => (
                          <tr key={bg.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold text-slate-900">{bg.paymasterName || "Group Paymaster"}</td>
                            <td className="py-2 px-3 text-center">{bg.attendeeCount || 0} seats</td>
                            <td className="py-2 px-3 text-right">{formatCurrency(parseFloat(bg.amountPerAttendee || "0"))}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">{formatCurrency(parseFloat(bg.totalAmount || "0"))}</td>
                            <td className="py-2 px-3 text-center font-mono text-[10px] text-muted-foreground">{bg.paymentRef || "—"}</td>
                            <td className="py-2 px-3 text-center">
                              <Badge variant={bg.status === "PAID" ? "default" : "secondary"} className="text-[10px]">
                                {bg.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                    <div className="flex justify-between text-xs text-muted-foreground pt-1">
                      <span>{st.paid} Paid</span>
                      <span>{st.attended} Attended</span>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summary.lgasList.slice(0, 30).map((lg) => (
              <Card key={`${lg.state}-${lg.name}`} className="shadow-xs">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900">{lg.name}</CardTitle>
                      <CardDescription className="text-xs">{lg.state}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="font-bold">{lg.total}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground flex justify-between">
                  <span>{lg.paid} Paid</span>
                  <span>{lg.attended} Attended</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Branches Tab */}
        <TabsContent value="branches" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summary.branchesList.slice(0, 30).map((br) => (
              <Card key={`${br.state}-${br.lga}-${br.name}`} className="shadow-xs">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900">{br.name}</CardTitle>
                      <CardDescription className="text-xs">{br.lga}, {br.state}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="font-bold">{br.total}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground flex justify-between">
                  <span>{br.paid} Paid</span>
                  <span>{br.attended} Attended</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Registration Channels Tab */}
        <TabsContent value="modes" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">Direct Registrations</CardTitle>
                <CardDescription>Direct self-registration by attendees</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-blue-700">{summary.directCount}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {summary.total > 0 ? Math.round((summary.directCount / summary.total) * 100) : 0}% of total attendees
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
                  {summary.total > 0 ? Math.round((summary.bulkCount / summary.total) * 100) : 0}% of total attendees
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
                  {summary.total > 0 ? Math.round((summary.sponsorCount / summary.total) * 100) : 0}% of total attendees
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sponsorship Pools Tab */}
        <TabsContent value="sponsorship" className="space-y-4">
          {sponsorshipPools.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
              No sponsorship pools created for this programme.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-purple-950 text-sm">Total Sponsorship Pool Inflows</div>
                  <div className="text-xs text-purple-800">
                    {summary.paidPoolsCount} Paid Pools &bull; {summary.totalSponsorSeats} Total Seats Donated &bull; {summary.claimedSponsorSeats} Claimed &bull; {Math.max(0, summary.totalSponsorSeats - summary.claimedSponsorSeats)} Available
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-purple-700 uppercase font-bold tracking-wider">Total Inflow</div>
                  <div className="text-xl font-black text-purple-950">{formatCurrency(summary.poolsPaidRevenue)}</div>
                </div>
              </div>

              {sponsorshipPools.map((pool: any) => {
                const seatsLeft = Math.max(0, (pool.seatCount || 0) - (pool.seatsClaimed || 0));
                const isPaid = pool.status === "PAID";
                const claimers = registrations.filter((r: RegistrationStat) => r.sponsorPoolId === pool.id);
                return (
                  <Card key={pool.id} className="shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 rounded-lg"><HeartHandshake className="h-5 w-5 text-emerald-700" /></div>
                          <div>
                            <CardTitle className="text-lg font-bold">{pool.sponsorName || "Anonymous Sponsor"}</CardTitle>
                            <CardDescription className="text-xs">
                              Code: <code className="font-mono text-emerald-700">{pool.sponsorCode}</code> &bull; {pool.seatCount} seats &bull; {pool.seatsClaimed || 0} claimed &bull; {seatsLeft} left &bull; {formatCurrency(parseFloat(pool.totalAmount || "0"))}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={isPaid ? "default" : "secondary"}>{pool.status}</Badge>
                          {pool.paymentRef && (
                            <span className="text-[10px] font-mono text-muted-foreground border px-2 py-0.5 rounded bg-slate-50">
                              {pool.paymentRef}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {claimers.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">No claims registered yet for this pool.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b text-left text-muted-foreground">
                                <th className="pb-2">Name</th>
                                <th className="pb-2">Email</th>
                                <th className="pb-2">State</th>
                                <th className="pb-2">LGA</th>
                                <th className="pb-2">Branch</th>
                                <th className="pb-2">Phone</th>
                                <th className="pb-2">Check-in</th>
                              </tr>
                            </thead>
                            <tbody>
                              {claimers.map((c: RegistrationStat) => (
                                <tr key={c.id} className="border-b">
                                  <td className="py-2 font-medium">{c.name}</td>
                                  <td className="py-2">{c.email}</td>
                                  <td className="py-2">{c.state || "-"}</td>
                                  <td className="py-2">{c.lga || "-"}</td>
                                  <td className="py-2">{c.branch || "-"}</td>
                                  <td className="py-2">{c.phone || "-"}</td>
                                  <td className="py-2 text-muted-foreground">{c.checkInTime ? new Date(c.checkInTime).toLocaleString() : "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Shareable Link Tab */}
        <TabsContent value="shareable-link" className="space-y-4">
          <ProgrammeShareTab 
            programme={{ 
              id: programmeId || "", 
              title: programmeTitle, 
              startDate: programmeStartDate, 
              amount: programmeAmount 
            }} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

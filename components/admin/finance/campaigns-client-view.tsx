"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignActions } from "@/components/admin/finance/campaign-actions";
import { CreateCampaignDialog } from "@/components/admin/finance/create-campaign-dialog";
import { Target, TrendingUp, DollarSign, PieChart, Search, X, ExternalLink, Download } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface CampaignData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  targetAmount: string | null;
  raisedAmount: string | null;
  startDate: string | Date | null;
  endDate?: string | Date | null;
  status: string | null;
  organizationId: string;
  organizationCode?: string | null;
  organizationName?: string | null;
}

export function CampaignsClientView({
  campaigns,
  organizationId,
  organizationCode,
}: {
  campaigns: CampaignData[];
  organizationId: string;
  organizationCode?: string;
}) {
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const totals = useMemo(() => {
    let totalTarget = 0;
    let totalRaised = 0;
    for (const c of campaigns) {
      totalTarget += parseFloat(c.targetAmount || "0");
      totalRaised += parseFloat(c.raisedAmount || "0");
    }
    const totalBalance = Math.max(0, totalTarget - totalRaised);
    const overallProgress = totalTarget > 0 ? (totalRaised / totalTarget) * 100 : 0;
    return { totalTarget, totalRaised, totalBalance, overallProgress };
  }, [campaigns]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return campaigns;
    return campaigns.filter((c) => {
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchDesc = (c.description || "").toLowerCase().includes(q);
      const matchStatus = (c.status || "").toLowerCase().includes(q);
      const matchOrg = (c.organizationName || "").toLowerCase().includes(q);
      return matchTitle || matchDesc || matchStatus || matchOrg;
    });
  }, [campaigns, query]);

  const exportCSV = () => {
    const headers = ["Campaign Title", "Status", "Target Amount (NGN)", "Actual Raised (NGN)", "Balance Remaining (NGN)", "% Progress", "Start Date"];
    const rows = filtered.map((c) => {
      const t = parseFloat(c.targetAmount || "0");
      const r = parseFloat(c.raisedAmount || "0");
      const b = Math.max(0, t - r);
      const pct = t > 0 ? ((r / t) * 100).toFixed(1) : "0";
      return [
        `"${c.title.replace(/"/g, '""')}"`,
        c.status,
        t,
        r,
        b,
        `${pct}%`,
        formatDate(c.startDate || new Date()),
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fundraising_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("The Muslim Congress — Fundraising Report", 14, 18);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()} | Total Target: NGN ${totals.totalTarget.toLocaleString()} | Total Raised: NGN ${totals.totalRaised.toLocaleString()}`, 14, 26);

    const body = filtered.map((c) => {
      const t = parseFloat(c.targetAmount || "0");
      const r = parseFloat(c.raisedAmount || "0");
      const b = Math.max(0, t - r);
      const pct = t > 0 ? `${((r / t) * 100).toFixed(1)}%` : "0%";
      return [
        c.title,
        c.status || "PENDING",
        `NGN ${t.toLocaleString()}`,
        `NGN ${r.toLocaleString()}`,
        `NGN ${b.toLocaleString()}`,
        pct,
      ];
    });

    autoTable(doc, {
      startY: 32,
      head: [["Campaign Title", "Status", "Target Amount", "Actual Raised", "Balance Remaining", "% Progress"]],
      body: body,
      headStyles: { fillColor: [22, 101, 52] },
      styles: { fontSize: 9 },
    });

    doc.save(`fundraising_report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-green-950">Fundraising Campaigns & Reports</h1>
          <p className="text-muted-foreground text-sm">
            Live tracker showing target amount, actual funds raised, and remaining balance at all times.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="mr-1.5 h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <Download className="mr-1.5 h-4 w-4" /> PDF
          </Button>
          <CreateCampaignDialog organizationId={organizationId || ""} />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-emerald-50/50 border-emerald-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-emerald-800 flex items-center gap-1.5">
              <Target className="h-4 w-4" /> Total Target Goal
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-950">
              {formatCurrency(totals.totalTarget)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-blue-50/50 border-blue-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-blue-800 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" /> Actual Amount Raised
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-950">
              {formatCurrency(totals.totalRaised)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-amber-50/50 border-amber-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-amber-800 flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" /> Remaining Balance
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-950">
              {formatCurrency(totals.totalBalance)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-purple-50/50 border-purple-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-purple-800 flex items-center gap-1.5">
              <PieChart className="h-4 w-4" /> Overall Accomplishment
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-purple-950">
              {totals.overallProgress.toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Live Search & View Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns (min. 2-3 characters)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-8 h-9 text-sm"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList>
            <TabsTrigger value="table">Table Report</TabsTrigger>
            <TabsTrigger value="cards">Cards Grid</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      {viewMode === "table" ? (
        <div className="overflow-x-auto border rounded-xl bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Campaign Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Target (₦)</TableHead>
                <TableHead className="text-right">Actual Raised (₦)</TableHead>
                <TableHead className="text-right">Remaining Balance (₦)</TableHead>
                <TableHead className="text-right">% Progress</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {query ? `No campaigns matching "${query}".` : "No campaigns found."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => {
                  const target = parseFloat(c.targetAmount || "0");
                  const raised = parseFloat(c.raisedAmount || "0");
                  const balance = Math.max(0, target - raised);
                  const pct = target > 0 ? (raised / target) * 100 : 0;

                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-semibold text-gray-900">
                        <div className="flex items-center gap-1.5">
                          <span>{c.title}</span>
                          <Link
                            href={`/${organizationCode || c.organizationCode || "national"}/campaigns/${c.slug}`}
                            target="_blank"
                            title="View Public Page"
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-emerald-700" />
                          </Link>
                        </div>
                        {c.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {c.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"} className="text-[11px]">
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(target)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-700">
                        {formatCurrency(raised)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-amber-700">
                        {formatCurrency(balance)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <span className="font-semibold text-xs">{pct.toFixed(1)}%</span>
                          <div className="w-16">
                            <Progress value={pct} className="h-1.5" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <CampaignActions campaign={c as any} />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((campaign) => {
            const target = parseFloat(campaign.targetAmount || "0");
            const raised = parseFloat(campaign.raisedAmount || "0");
            const balance = Math.max(0, target - raised);
            const percentage = target > 0 ? (raised / target) * 100 : 0;

            return (
              <Card key={campaign.id} className="flex flex-col shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge variant={campaign.status === "ACTIVE" ? "default" : "secondary"}>
                      {campaign.status}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/${organizationCode || campaign.organizationCode || "national"}/campaigns/${campaign.slug}`}
                        target="_blank"
                        title="View public page"
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </Link>
                      <CampaignActions campaign={campaign as any} />
                    </div>
                  </div>
                  <CardTitle className="mt-2 line-clamp-1">{campaign.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {campaign.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Target Goal</span>
                      <span className="font-semibold">{formatCurrency(target)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Actual Raised</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(raised)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Remaining Balance</span>
                      <span className="font-bold text-amber-600">{formatCurrency(balance)}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{percentage.toFixed(1)}% accomplished</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground border-t pt-2">
                    Started {formatDate(campaign.startDate || new Date())}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

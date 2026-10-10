"use client";

import { useState, useMemo, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/utils";
import { approveRequest, disburseRequest, rejectRequest } from "@/lib/actions/finance";
import { toast } from "sonner";
import { Search, X, CheckCircle, ArrowRight, ShieldCheck, CreditCard, Ban, Clock, Loader2 } from "lucide-react";

export interface RequestItem {
  id: string;
  title: string;
  description: string;
  amount: string | number;
  status: string | null;
  createdAt: string | Date | null;
  rejectionReason?: string | null;
  organizationName?: string | null;
  organizationLevel?: string | null;
  requester?: { id: string; name: string | null; email: string | null } | null;
  recommender?: { id: string; name: string | null } | null;
  approver?: { id: string; name: string | null } | null;
  disburser?: { id: string; name: string | null } | null;
}

export function RequestsClientList({
  requests,
  canApprove,
  canDisburse,
}: {
  requests: RequestItem[];
  canApprove: boolean;
  canDisburse: boolean;
}) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((r) => {
      // Tab filter
      let matchesTab = true;
      if (activeTab === "pending") matchesTab = r.status === "PENDING";
      else if (activeTab === "approved") matchesTab = r.status === "APPROVED";
      else if (activeTab === "disbursed") matchesTab = r.status === "DISBURSED";
      else if (activeTab === "rejected") matchesTab = r.status === "REJECTED";

      if (!matchesTab) return false;

      // Search query filter (3+ chars or live)
      if (!q || q.length < 2) return true;
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchDesc = (r.description || "").toLowerCase().includes(q);
      const matchRequester = (r.requester?.name || "").toLowerCase().includes(q);
      const matchOrg = (r.organizationName || "").toLowerCase().includes(q);
      return matchTitle || matchDesc || matchRequester || matchOrg;
    });
  }, [requests, activeTab, query]);

  const handleApprove = (id: string) => {
    if (!confirm("Approve this fund request as Executive Leader (Amir / Waali / Wakil / Raqib)?")) return;
    setActionId(id);
    startTransition(async () => {
      const res = await approveRequest(id);
      setActionId(null);
      if (res.success) {
        toast.success("Fund request approved and routed to Financial Secretary for disbursement.");
      } else {
        toast.error(res.error || "Approval failed");
      }
    });
  };

  const handleDisburse = (id: string) => {
    const voucherRef = prompt("Enter payment voucher / transaction reference (optional):");
    if (voucherRef === null) return;
    setActionId(id);
    startTransition(async () => {
      const res = await disburseRequest(id, voucherRef || undefined);
      setActionId(null);
      if (res.success) {
        toast.success("Funds marked disbursed. Ledger outflow entry created.");
      } else {
        toast.error(res.error || "Disbursement failed");
      }
    });
  };

  const handleReject = (id: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    setActionId(id);
    startTransition(async () => {
      const res = await rejectRequest(id, reason);
      setActionId(null);
      if (res.success) {
        toast.success("Fund request rejected.");
      } else {
        toast.error(res.error || "Rejection failed");
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Stage 1: Pending Leader Approval</Badge>;
      case "APPROVED":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Stage 2: Approved (Pending Fin Sec)</Badge>;
      case "DISBURSED":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Stage 3: Disbursed & Closed</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fund requests by title, requester, description (min. 2-3 chars)..."
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
        {query && query.length >= 2 && (
          <span className="text-xs text-muted-foreground self-center">
            Showing {filtered.length} matching requests
          </span>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full h-auto gap-1">
          <TabsTrigger value="all" className="text-xs py-2">All ({requests.length})</TabsTrigger>
          <TabsTrigger value="pending" className="text-xs py-2">Pending Leader ({requests.filter(r => r.status === 'PENDING').length})</TabsTrigger>
          <TabsTrigger value="approved" className="text-xs py-2">Pending Fin Sec ({requests.filter(r => r.status === 'APPROVED').length})</TabsTrigger>
          <TabsTrigger value="disbursed" className="text-xs py-2">Disbursed ({requests.filter(r => r.status === 'DISBURSED').length})</TabsTrigger>
          <TabsTrigger value="rejected" className="text-xs py-2">Rejected ({requests.filter(r => r.status === 'REJECTED').length})</TabsTrigger>
        </TabsList>

        <div className="mt-4 space-y-4">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border rounded-xl border-dashed">
              {query ? `No requests matching "${query}".` : "No fund requests in this section."}
            </div>
          ) : (
            filtered.map((req) => (
              <Card key={req.id} className="overflow-hidden shadow-sm hover:shadow transition-shadow">
                <CardHeader className="pb-3 bg-muted/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-bold text-green-950">{req.title}</CardTitle>
                        {req.organizationName && (
                          <Badge variant="outline" className="text-[11px] font-semibold">
                            {req.organizationName}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs mt-0.5">
                        Requested by <b>{req.requester?.name || "Officer"}</b> on {formatDate(req.createdAt || new Date())}
                      </CardDescription>
                    </div>
                    <div>{getStatusBadge(req.status || "PENDING")}</div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap bg-muted/40 p-3 rounded-lg border">
                    {req.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground uppercase font-semibold">Amount Requested</span>
                      <div className="font-extrabold text-2xl text-emerald-700">
                        {formatCurrency(req.amount)}
                      </div>
                    </div>
                  </div>

                  {/* 4-Stage Hierarchy Audit Tracking Bar */}
                  <div className="rounded-lg border bg-gray-50/80 p-3 text-xs space-y-2">
                    <span className="font-semibold text-gray-700 block">Workflow Chain & Audit Trail:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className={`p-2 rounded border ${req.status !== 'REJECTED' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                        <div className="font-bold flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> 1. Submission
                        </div>
                        <div className="text-[11px] mt-0.5">{req.requester?.name || "Officer"}</div>
                      </div>

                      <div className={`p-2 rounded border ${req.approver ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : req.status === 'PENDING' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-gray-100 text-gray-500'}`}>
                        <div className="font-bold flex items-center gap-1">
                          {req.approver ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <Clock className="h-3.5 w-3.5" />}
                          2. Executive Leader (Amir/Waali/Wakil/Raqib)
                        </div>
                        <div className="text-[11px] mt-0.5">
                          {req.approver ? `Approved by ${req.approver.name}` : "Awaiting Leader Review"}
                        </div>
                      </div>

                      <div className={`p-2 rounded border ${req.disburser ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : req.status === 'APPROVED' ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                        <div className="font-bold flex items-center gap-1">
                          {req.disburser ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <CreditCard className="h-3.5 w-3.5" />}
                          3. Financial Secretary
                        </div>
                        <div className="text-[11px] mt-0.5">
                          {req.disburser ? `Disbursed by ${req.disburser.name}` : req.status === 'APPROVED' ? "Awaiting Disbursement" : "Pending Approval First"}
                        </div>
                      </div>
                    </div>

                    {req.rejectionReason && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
                        <b>Rejection Reason:</b> {req.rejectionReason}
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex flex-wrap items-center justify-end gap-2 border-t pt-3 bg-muted/10">
                  {/* Executive Leader Actions */}
                  {req.status === "PENDING" && canApprove && (
                    <>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(req.id)}
                        disabled={isPending && actionId === req.id}
                      >
                        <Ban className="h-4 w-4 mr-1" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                        onClick={() => handleApprove(req.id)}
                        disabled={isPending && actionId === req.id}
                      >
                        {isPending && actionId === req.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <ShieldCheck className="h-4 w-4 mr-1" />
                        )}
                        Approve & Forward to Fin Sec
                      </Button>
                    </>
                  )}

                  {/* Financial Secretary Actions */}
                  {req.status === "APPROVED" && canDisburse && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white font-bold"
                      onClick={() => handleDisburse(req.id)}
                      disabled={isPending && actionId === req.id}
                    >
                      {isPending && actionId === req.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <CreditCard className="h-4 w-4 mr-1" />
                      )}
                      Disburse & Close Out
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </Tabs>
    </div>
  );
}

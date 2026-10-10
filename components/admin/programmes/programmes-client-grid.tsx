"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserCheck, BarChart3, MessageSquare, Video, FileText, Search, X, XCircle } from "lucide-react";
import { ProgrammeActions } from "@/components/admin/programmes/programme-actions";
import { ReviewActions } from "@/components/admin/programmes/review-actions";
import { SubmitReportDialog } from "@/components/admin/programmes/submit-report-dialog";
import { ClientDate } from "@/components/ui/client-date";
import { ClientCurrency } from "@/components/ui/client-currency";

const getStatusColor = (status: string) => {
  switch (status) {
    case "APPROVED":
      return "bg-green-500";
    case "PENDING_STATE":
      return "bg-yellow-500";
    case "PENDING_NATIONAL":
      return "bg-orange-500";
    case "REJECTED":
      return "bg-red-500";
    case "COMPLETED":
      return "bg-blue-500";
    default:
      return "bg-gray-500";
  }
};

export function ProgrammesClientGrid({
  programmes,
  type,
  currentUserId,
  isSuperAdmin,
  userLevel,
  userOfficialId,
}: {
  programmes: any[];
  type: "MY_PROGRAMMES" | "TO_APPROVE";
  currentUserId: string;
  isSuperAdmin: boolean;
  userLevel: string;
  userOfficialId: string;
}) {
  const [query, setQuery] = useState("");

  const filteredProgrammes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return programmes;
    return programmes.filter((p) => {
      const matchTitle = p.title?.toLowerCase().includes(q);
      const matchVenue = (p.venue || "").toLowerCase().includes(q);
      const matchDesc = (p.description || "").toLowerCase().includes(q);
      const matchOrg = (p.organization?.name || "").toLowerCase().includes(q);
      const matchOffice = (p.office?.name || "").toLowerCase().includes(q);
      const matchStatus = (p.status || "").toLowerCase().includes(q);
      return matchTitle || matchVenue || matchDesc || matchOrg || matchOffice || matchStatus;
    });
  }, [programmes, query]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search programmes (min. 2-3 characters)..."
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
          <span className="text-xs text-muted-foreground">
            Found {filteredProgrammes.length} of {programmes.length}
          </span>
        )}
      </div>

      {filteredProgrammes.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border rounded-md border-dashed">
          {query ? `No programmes matching "${query}".` : "No programmes found."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProgrammes.map((p) => (
            <div
              key={p.id}
              className="bg-[#031408] border border-green-800/30 shadow-xl rounded-2xl overflow-hidden hover:border-green-700/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="pb-3 bg-[#0c2413]/40 border-b border-green-800/20 p-5 flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white tracking-tight">{p.title}</h3>
                    <div className="text-green-300 font-medium text-sm mt-1">
                      <ClientDate date={p.startDate} formatString="PPP" /> @ {p.venue}
                    </div>
                    {p.organization && (
                      <div className="text-emerald-400/80 font-semibold text-xs uppercase tracking-wider mt-0.5">
                        {p.organization.name}
                      </div>
                    )}
                    {p.office && (
                      <Badge variant="outline" className="mt-1 border-emerald-800 text-emerald-300 bg-emerald-950/60">
                        {p.office.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {p.isLateSubmission && (
                      <Badge variant="destructive" className="animate-pulse">
                        LATE
                      </Badge>
                    )}
                    <Badge className={`${getStatusColor(p.status || "")} text-white shadow-sm font-bold`}>
                      {p.status?.replace("_", " ")}
                    </Badge>
                    <ProgrammeActions
                      programme={p}
                      canEdit={
                        isSuperAdmin ||
                        userLevel === "NATIONAL" ||
                        userLevel === "STATE" ||
                        p.organizingOfficialId === userOfficialId
                      }
                    />
                  </div>
                </div>
                <div className="p-5 space-y-4 bg-[#031408]">
                  <p className="text-sm text-green-50/90 font-normal leading-relaxed">{p.description}</p>

                  {p.status === "REJECTED" && p.rejectionReason && (
                    <Alert variant="destructive" className="bg-red-950/40 border-red-900/60 text-red-100">
                      <XCircle className="h-4 w-4 text-red-400" />
                      <AlertTitle className="text-red-300 text-xs font-bold uppercase tracking-wider">
                        Rejection Reason
                      </AlertTitle>
                      <AlertDescription className="text-red-200 text-sm font-medium">
                        {p.rejectionReason}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-between items-center text-sm font-semibold text-green-200/80 pt-2">
                    <span>Target: {p.targetAudience}</span>
                    {p.paymentRequired ? (
                      <ClientCurrency amount={p.amount || 0} className="text-emerald-400 font-bold" />
                    ) : (
                      <span className="text-emerald-400 font-bold">Free</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 bg-[#0c2413]/20 border-t border-green-800/10 flex flex-wrap gap-2 justify-between items-center mt-auto">
                {/* Approval Actions */}
                {type === "TO_APPROVE" && (
                  <ReviewActions
                    programmeId={p.id}
                    status={p.status || ""}
                    hasCertificate={p.hasCertificate ?? false}
                  />
                )}

                {/* Reporting & Registration Actions */}
                {type === "MY_PROGRAMMES" && (p.status === "APPROVED" || p.status === "COMPLETED") && (
                  <div className="flex flex-wrap items-center gap-2 w-full justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="bg-green-950/60 hover:bg-green-900/80 border border-green-800/40 text-green-300 font-semibold px-3 py-1.5 text-xs rounded-lg transition-colors"
                      >
                        <a href={`/dashboard/admin/programmes/${p.id}/registrations`}>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Registrations
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="bg-green-950/60 hover:bg-green-900/80 border border-green-800/40 text-green-300 font-semibold px-3 py-1.5 text-xs rounded-lg transition-colors"
                      >
                        <a href={`/dashboard/admin/programmes/${p.id}/analytics`}>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Analytics
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="bg-green-950/60 hover:bg-green-900/80 border border-green-800/40 text-green-300 font-semibold px-3 py-1.5 text-xs rounded-lg transition-colors"
                      >
                        <a href={`/dashboard/programmes/${p.id}/group`}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Lounge
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="bg-green-950/60 hover:bg-green-900/80 border border-green-800/40 text-green-300 font-semibold px-3 py-1.5 text-xs rounded-lg transition-colors"
                      >
                        <a href={`/dashboard/admin/programmes/${p.id}/notes`}>
                          <FileText className="w-4 h-4 mr-2" />
                          Notes
                        </a>
                      </Button>
                      {(p as any).meeting && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="bg-emerald-900 hover:bg-emerald-800 border border-emerald-700 text-emerald-100 font-bold px-3 py-1.5 text-xs rounded-lg transition-colors shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                        >
                          <a href={`/dashboard/admin/meetings/${(p as any).meeting.id}`}>
                            <Video className="w-4 h-4 mr-2" />
                            Virtual Room
                          </a>
                        </Button>
                      )}
                    </div>
                    {(p.status === "COMPLETED" || new Date(p.startDate) < new Date()) && (
                      <SubmitReportDialog programmeId={p.id} programmeTitle={p.title} />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

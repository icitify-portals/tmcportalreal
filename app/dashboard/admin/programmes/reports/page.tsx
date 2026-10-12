export const dynamic = "force-dynamic";

import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getProgrammeReportRollup } from "@/lib/actions/programme-reports-aggregate";
import { getRegistrationAnalyticsByLevel } from "@/lib/actions/programme-reports-aggregate";
import { getProgrammeGradesLive } from "@/lib/actions/programme-grading";
import { ReportFilters } from "@/components/admin/programmes/reports/report-filters";
import { RollupStats } from "@/components/admin/programmes/reports/rollup-stats";
import { ReportsCharts } from "@/components/admin/programmes/reports/reports-charts";
import { ReportsTable } from "@/components/admin/programmes/reports/reports-table";
import { ReportExport } from "@/components/admin/programmes/reports/report-export";
import { LevelGrading } from "@/components/admin/programmes/reports/level-grading";
import { RegistrationAnalytics } from "@/components/admin/programmes/reports/registration-analytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPeriodDateRange } from "@/lib/report-period";
import { db } from "@/lib/db";
import { organizations, offices, userRoles, roles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { ReportScope } from "@/lib/report-period";

export default async function ProgrammeReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; year?: string; quarter?: string; month?: string; officeId?: string; targetOrgId?: string }>;
}) {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/auth/signin");

  const sp = await searchParams;
  const scope = (sp.scope as ReportScope) ?? "monthly";
  const now = new Date();
  const year = sp.year ? parseInt(sp.year) : now.getFullYear();
  const quarter = sp.quarter ? parseInt(sp.quarter) : (scope === "quarterly" ? Math.floor(now.getMonth() / 3) + 1 : undefined);
  const month = sp.month ? parseInt(sp.month) : (scope === "monthly" ? now.getMonth() + 1 : undefined);
  const officeId = sp.officeId || undefined;
  const targetOrgId = sp.targetOrgId || undefined;

  // Resolve caller's org & jurisdictions for filter
  const userRolesList = await db
    .select({ orgId: userRoles.organizationId })
    .from(userRoles)
    .where(and(eq(userRoles.userId, session.user.id), eq(userRoles.isActive, true)))
    .limit(10);

  let baseOrgId = (session.user as any).officialOrganizationId || userRolesList[0]?.orgId || null;
  if (!baseOrgId) {
    const nat = await db.select({ id: organizations.id, name: organizations.name }).from(organizations).where(eq(organizations.level, "NATIONAL")).limit(1);
    baseOrgId = nat[0]?.id ?? null;
  }
  const baseOrg = baseOrgId ? await db.select({ id: organizations.id, name: organizations.name, level: organizations.level }).from(organizations).where(eq(organizations.id, baseOrgId)).then((r) => r[0]) : null;

  // All orgs for jurisdiction selector (children of base)
  let jurisdictions: { id: string; name: string; level: string }[] = [];
  let officeList: { id: string; name: string }[] = [];
  if (baseOrgId) {
    const allOrgs = await db.select({ id: organizations.id, name: organizations.name, level: organizations.level, parentId: organizations.parentId }).from(organizations);
    // simple BFS filter
    const map = new Map<string, string[]>();
    for (const o of allOrgs) {
      if (!o.parentId) continue;
      if (!map.has(o.parentId)) map.set(o.parentId, []);
      map.get(o.parentId)!.push(o.id);
    }
    const collect: string[] = [];
    const q = [baseOrgId];
    const seen = new Set<string>();
    while (q.length) {
      const cur = q.shift()!;
      if (seen.has(cur)) continue;
      seen.add(cur);
      collect.push(cur);
      (map.get(cur) ?? []).forEach((c) => q.push(c));
    }
    jurisdictions = allOrgs.filter((o) => collect.includes(o.id) && o.id !== baseOrgId).map((o) => ({ id: o.id, name: o.name, level: o.level }));
    // offices for current effective org (target or base)
    const effOrg = targetOrgId || baseOrgId;
    officeList = await db.select({ id: offices.id, name: offices.name }).from(offices).where(eq(offices.organizationId, effOrg));
    if (officeList.length === 0 && !targetOrgId) {
      // also try national offices if empty
      officeList = await db.select({ id: offices.id, name: offices.name }).from(offices).limit(20);
    }
  }

  // fallback years: from programmes startDate or default last 5
  const yearSet = new Set<number>([year, new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2]);
  const availableYears = Array.from(yearSet).sort((a, b) => b - a);

  const rollup = await getProgrammeReportRollup({
    scope,
    year,
    quarter: scope === "quarterly" ? quarter : undefined,
    month: scope === "monthly" ? month : undefined,
    officeId,
    targetOrganizationId: targetOrgId,
  }).catch((e) => {
    console.error("rollup error", e);
    return null;
  });

  const grading = await getProgrammeGradesLive({
    scope,
    year,
    quarter: scope === "quarterly" ? quarter : undefined,
    month: scope === "monthly" ? month : undefined,
    targetOrganizationId: targetOrgId,
    officeId,
  }).catch((e) => {
    console.error("grading error", e);
    return null;
  });

  const registrationAnalytics = await getRegistrationAnalyticsByLevel({
    scope,
    year,
    quarter: scope === "quarterly" ? quarter : undefined,
    month: scope === "monthly" ? month : undefined,
    targetOrganizationId: targetOrgId,
    officeId,
  }).catch((e) => {
    console.error("registration analytics error", e);
    return null;
  });

  const { start, end, label } = getPeriodDateRange(scope, year, quarter, month);

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-emerald-950">Programme Reports — {label}</h2>
            <p className="text-sm font-medium text-slate-700 mt-1">
              Cumulative submitted reports for <b className="text-slate-900">{baseOrg?.name ?? "—"}</b> and its jurisdictions • <span className="text-emerald-900 font-semibold">{start.toLocaleDateString()} → {end.toLocaleDateString()}</span>
              {targetOrgId ? ` • Filtered: ${jurisdictions.find((j) => j.id === targetOrgId)?.name ?? targetOrgId}` : ""} • Scope: <span className="uppercase text-emerald-800 font-semibold">{scope}</span> • National cockpit shows drill-down by jurisdiction & office.
            </p>
          </div>
          {rollup && <ReportExport summary={rollup.summary} details={rollup.details} metaLabel={label} />}
        </div>

        <ReportFilters
          scope={scope}
          year={year}
          quarter={quarter}
          month={month}
          officeId={officeId}
          targetOrgId={targetOrgId}
          years={availableYears}
          offices={officeList}
          jurisdictions={jurisdictions}
          currentOrgName={baseOrg?.name ?? "Jurisdiction"}
        />

        {!rollup ? (
          <div className="p-8 text-center border rounded-xl border-dashed bg-white text-slate-700 font-medium">Failed to load reports. Ensure you have programmes in this period.</div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="bg-emerald-50/80 border border-emerald-200/80 p-1 rounded-xl">
              <TabsTrigger value="overview" className="font-semibold text-slate-700 data-[state=active]:bg-emerald-700 data-[state=active]:text-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
              <TabsTrigger value="registrations" className="font-semibold text-slate-700 data-[state=active]:bg-emerald-700 data-[state=active]:text-white data-[state=active]:shadow-sm">Registrations by Level</TabsTrigger>
              <TabsTrigger value="grading" className="font-semibold text-slate-700 data-[state=active]:bg-emerald-700 data-[state=active]:text-white data-[state=active]:shadow-sm">Grading — Performance</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
            <RollupStats summary={rollup.summary} />

            {/* Guidance for officers */}
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-4 text-xs leading-relaxed text-slate-800 shadow-sm">
              <b className="text-emerald-950 font-bold">How it works:</b> National admin sees every jurisdiction (branch → LGA → State → National) aggregated at a click; office filter shows each national officer’s submissions (State executives filtered at state, etc.). Monthly → specific month, Quarterly → grouped by month within quarter, Annual/YTD → full-year trend. Use CSV/PDF or Share link. Attendees & spend come from <code className="bg-emerald-100 text-emerald-900 font-semibold px-1 py-0.5 rounded">programme_reports</code> submitted after each event.
            </div>

            <ReportsCharts byPeriod={rollup.byPeriod} byOffice={rollup.byOffice} byLevel={rollup.byLevel} byOrganization={rollup.byOrganization} />

            <div className="space-y-2">
              <h3 className="font-bold text-base text-slate-950">Detailed Programme Reports ({rollup.details.length})</h3>
              <p className="text-xs font-medium text-slate-600">Each row shows office & reporting officer (organizingOfficial). National can switch jurisdiction to view any level’s submissions.</p>
              <ReportsTable details={rollup.details} />
            </div>
            </TabsContent>
            <TabsContent value="registrations" className="space-y-4">
              {registrationAnalytics ? (
                <RegistrationAnalytics data={registrationAnalytics} />
              ) : (
                <div className="text-sm font-medium text-slate-700 bg-white p-4 rounded-xl border border-slate-200">Registration analytics unavailable for this period.</div>
              )}
            </TabsContent>
            <TabsContent value="grading" className="space-y-4">
              {grading ? <LevelGrading data={grading} /> : <div className="text-sm font-medium text-slate-700 bg-white p-4 rounded-xl border border-slate-200">Grading unavailable for this period.</div>}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}

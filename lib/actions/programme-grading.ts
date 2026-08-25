"use server";

import { db } from "@/lib/db";
import { programmes, programmeReports, organizations, financeBudgets } from "@/lib/db/schema";
import { and, eq, gte, lte, inArray } from "drizzle-orm";
import { getProgrammeReportRollup } from "./programme-reports-aggregate";
import { computeProgrammeGrade, type GradeBreakdown, scoreToGrade } from "@/lib/grading";
import { getPeriodDateRange, type ReportScope } from "@/lib/report-period";
import { getServerSession } from "@/lib/session";

export async function getProgrammeGrades(params: {
  scope: ReportScope;
  year: number;
  quarter?: number;
  month?: number;
  targetOrganizationId?: string;
  officeId?: string;
}) {
  const rollup = await getProgrammeReportRollup({
    scope: params.scope,
    year: params.year,
    quarter: params.quarter,
    month: params.month,
    targetOrganizationId: params.targetOrganizationId,
    officeId: params.officeId,
  });

  // Map each detail to grade
  const graded = rollup.details.map((d) => {
    const prog = (rollup as any).rawProgMap?.[d.id] as any;
    // find budget for this programme from meta? fallback 0
    const breakdown: GradeBreakdown = computeProgrammeGrade({
      status: d.status,
      isLateSubmission: (d as any).isLateSubmission,
      report: d.report ? {
        attendeesMale: d.report.attendeesMale,
        attendeesFemale: d.report.attendeesFemale,
        summary: (d as any).summary ?? null,
        images: (d as any).images ?? null,
        lecturers: (d as any).lecturers ?? null,
        topic: (d as any).topic ?? null,
        submittedAt: d.report.submittedAt,
      } : null,
      startDate: d.startDate,
      endDate: (d as any).endDate ?? null,
      budget: (d as any).budget ?? null,
      amountSpent: d.report?.amountSpent ?? null,
    });
    // Since rollup details lack summary/images etc., fetch richer via second query if needed (lightweight: use report data)
    return {
      ...d,
      grade: breakdown.grade,
      score: breakdown.weightedScore,
      breakdown,
    };
  });

  // Aggregate per organization and per level
  const byOrg = new Map<string, { orgId: string; orgName: string; level: string; count: number; avgScore: number; grades: string[] }>();
  const byLevel = new Map<string, { level: string; count: number; avgScore: number; grades: string[] }>();

  for (const g of graded) {
    // org
    if (!byOrg.has(g.organizationId)) byOrg.set(g.organizationId, { orgId: g.organizationId, orgName: g.organizationName, level: g.level, count: 0, avgScore: 0, grades: [] });
    const o = byOrg.get(g.organizationId)!;
    o.count++; o.grades.push(g.grade);

    // level
    if (!byLevel.has(g.level)) byLevel.set(g.level, { level: g.level, count: 0, avgScore: 0, grades: [] });
    const l = byLevel.get(g.level)!;
    l.count++; l.grades.push(g.grade);
  }

  // compute averages
  const byOrgArr = Array.from(byOrg.values()).map((o) => {
    const avg = Math.round(o.grades.reduce((a, g) => a + gradeToScore(g as any), 0) / Math.max(1, o.grades.length));
    // But we have actual scores in graded, better avg by score:
    const scores = graded.filter((x) => x.organizationId === o.orgId).map((x) => x.score);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return { ...o, avgScore, grade: scoreToGrade(avgScore) };
  }).sort((a, b) => b.avgScore - a.avgScore);

  const byLevelArr = Array.from(byLevel.values()).map((l) => {
    const scores = graded.filter((x) => x.level === l.level).map((x) => x.score);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return { ...l, avgScore, grade: scoreToGrade(avgScore) };
  });

  // General performance: overall avg
  const overallAvg = graded.length ? Math.round(graded.reduce((a, b) => a + b.score, 0) / graded.length) : 0;

  return {
    gradedProgrammes: graded,
    byOrganization: byOrgArr,
    byLevel: byLevelArr,
    overall: { avgScore: overallAvg, grade: scoreToGrade(overallAvg), total: graded.length },
    summary: rollup.summary,
  };
}

function gradeToScore(g: string): number {
  switch (g) {
    case "A": return 90;
    case "B": return 72;
    case "C": return 57;
    case "D": return 42;
    default: return 20;
  }
}

// Simple live recompute that fetches full programme+report rows for accurate grading
export async function getProgrammeGradesLive(params: {
  scope: ReportScope;
  year: number;
  quarter?: number;
  month?: number;
  targetOrganizationId?: string;
  officeId?: string;
}) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const { start, end } = getPeriodDateRange(params.scope, params.year, params.quarter, params.month);

  // Resolve hierarchy like rollup but directly query programmes+reports for grading accuracy
  const baseRollup = await getProgrammeReportRollup(params);
  const hierarchyIds = (baseRollup as any).meta.hierarchyIds as string[];

  const filters: any[] = [
    inArray(programmes.organizationId, hierarchyIds),
    gte(programmes.startDate, start),
    lte(programmes.startDate, end),
  ];
  if (params.officeId) filters.push(eq(programmes.organizingOfficeId, params.officeId));

  const rows = await db
    .select({
      programme: programmes,
      report: programmeReports,
      orgName: organizations.name,
      budgetAmount: financeBudgets.totalAmount,
    })
    .from(programmes)
    .leftJoin(programmeReports, eq(programmeReports.programmeId, programmes.id))
    .leftJoin(organizations, eq(programmes.organizationId, organizations.id))
    .leftJoin(financeBudgets, eq(financeBudgets.programmeId, programmes.id))
    .where(and(...filters));

  const graded = rows.map((r) => {
    const breakdown = computeProgrammeGrade({
      status: r.programme.status as string,
      isLateSubmission: (r.programme as any).isLateSubmission,
      report: r.report ? {
        attendeesMale: r.report.attendeesMale,
        attendeesFemale: r.report.attendeesFemale,
        summary: r.report.summary,
        images: r.report.images as any,
        lecturers: r.report.lecturers,
        topic: r.report.topic,
        submittedAt: r.report.submittedAt,
      } : null,
      startDate: r.programme.startDate,
      endDate: r.programme.endDate,
      budget: (r.budgetAmount as any) ?? (r.programme as any).budget,
      amountSpent: r.report?.amountSpent ?? null,
    });
    return {
      id: r.programme.id,
      title: r.programme.title,
      startDate: r.programme.startDate,
      status: r.programme.status,
      level: r.programme.level,
      organizationId: r.programme.organizationId,
      organizationName: r.orgName ?? "",
      officeId: (r.programme as any).organizingOfficeId ?? null,
      report: r.report,
      ...breakdown,
      breakdown,
    };
  });

  // by org / by level
  const byOrgMap = new Map<string, { orgId: string; orgName: string; level: string; count: number; scores: number[] }>();
  const byLevelMap = new Map<string, { level: string; count: number; scores: number[] }>();
  for (const g of graded) {
    if (!byOrgMap.has(g.organizationId)) byOrgMap.set(g.organizationId, { orgId: g.organizationId, orgName: g.organizationName, level: g.level as string, count: 0, scores: [] });
    byOrgMap.get(g.organizationId)!.count++;
    byOrgMap.get(g.organizationId)!.scores.push(g.weightedScore);

    if (!byLevelMap.has(g.level as string)) byLevelMap.set(g.level as string, { level: g.level as string, count: 0, scores: [] });
    byLevelMap.get(g.level as string)!.count++;
    byLevelMap.get(g.level as string)!.scores.push(g.weightedScore);
  }

  const byOrganization = Array.from(byOrgMap.values()).map((v) => {
    const avg = v.scores.length ? Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length) : 0;
    return { orgId: v.orgId, orgName: v.orgName, level: v.level, count: v.count, avgScore: avg, grade: scoreToGrade(avg) };
  }).sort((a, b) => b.avgScore - a.avgScore);

  const byLevel = Array.from(byLevelMap.values()).map((v) => {
    const avg = v.scores.length ? Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length) : 0;
    return { level: v.level, count: v.count, avgScore: avg, grade: scoreToGrade(avg) };
  });

  const overallAvg = graded.length ? Math.round(graded.reduce((a, b) => a + b.weightedScore, 0) / graded.length) : 0;

  return {
    graded,
    byOrganization,
    byLevel,
    overall: { avgScore: overallAvg, grade: scoreToGrade(overallAvg), total: graded.length },
  };
}

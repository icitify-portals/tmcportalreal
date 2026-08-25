"use server";

import { db } from "@/lib/db";
import {
  programmes,
  programmeReports,
  organizations,
  offices,
  users,
  officials,
} from "@/lib/db/schema";
import { and, eq, gte, lte, inArray, sql, desc, asc } from "drizzle-orm";
import { getServerSession } from "@/lib/session";
import { getPeriodDateRange, type ReportScope } from "@/lib/report-period";

export interface RollupParams {
  organizationId?: string; // if omitted, uses caller's hierarchy
  scope: ReportScope;
  year: number;
  quarter?: number;
  month?: number;
  officeId?: string;
  targetOrganizationId?: string; // explicit org to filter (jurisdiction selector)
}

export interface RollupSummary {
  totalProgrammes: number;
  completed: number;
  pending: number;
  approved: number;
  rejected: number;
  totalAttendees: number;
  totalMale: number;
  totalFemale: number;
  totalSpent: number;
  totalBudget: number;
  avgAttendance: number;
}

export interface ByPeriod {
  period: string;
  count: number;
  completed: number;
  attendees: number;
  spent: number;
}

export interface ByOffice {
  officeId: string | null;
  officeName: string;
  count: number;
  completed: number;
  attendees: number;
  spent: number;
}

export interface ByLevel {
  level: string;
  count: number;
  completed: number;
}

export interface RollupDetail {
  id: string;
  title: string;
  startDate: Date;
  status: string;
  level: string;
  venue: string;
  organizationId: string;
  organizationName: string;
  officeId: string | null;
  officeName: string | null;
  officialId: string | null;
  officialName: string | null;
  report: {
    id: string | null;
    attendeesMale: number;
    attendeesFemale: number;
    amountSpent: string;
    submittedAt: Date | null;
    submittedByName: string | null;
  } | null;
}

async function getHierarchyIds(rootId: string): Promise<string[]> {
  // BFS over organizations children via parentId
  const allOrgs = await db.select({ id: organizations.id, parentId: organizations.parentId }).from(organizations);
  const map = new Map<string, string[]>();
  for (const o of allOrgs) {
    if (!o.parentId) continue;
    if (!map.has(o.parentId)) map.set(o.parentId, []);
    map.get(o.parentId)!.push(o.id);
  }
  const result: string[] = [];
  const queue = [rootId];
  const visited = new Set<string>();
  while (queue.length) {
    const cur = queue.shift()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    result.push(cur);
    const children = map.get(cur) ?? [];
    queue.push(...children);
  }
  return result;
}

async function resolveCallerOrgId(): Promise<string | null> {
  const session = await getServerSession();
  if (!session?.user?.id) return null;
  // prefer officialOrganizationId else userRoles
  const oid = (session.user as any).officialOrganizationId || (session.user as any).organizationId || null;
  if (oid) return oid as string;
  // fallback: query userRoles
  const { userRoles: ur, roles: r } = await import("@/lib/db/schema");
  const rows = await db
    .select({ orgId: ur.organizationId })
    .from(ur)
    .where(and(eq(ur.userId, session.user.id), eq(ur.isActive, true)))
    .limit(1);
  return rows[0]?.orgId ?? null;
}

export async function getProgrammeReportRollup(params: RollupParams) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const isSuperAdmin = (session.user as any).isSuperAdmin as boolean;

  let baseOrgId = params.organizationId ?? (await resolveCallerOrgId());
  // superAdmin can view any if targetOrganizationId provided, else national
  if (!baseOrgId) {
    const nat = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.level, "NATIONAL")).limit(1);
    baseOrgId = nat[0]?.id ?? null;
  }
  if (!baseOrgId) throw new Error("No organization context");

  // If targetOrganizationId supplied and caller isSuperAdmin or canAccess, use it as root (jurisdiction filter)
  let effectiveRoot = baseOrgId;
  if (params.targetOrganizationId) {
    effectiveRoot = params.targetOrganizationId;
    // for non-superAdmin, verify hierarchy access
    if (!isSuperAdmin) {
      const allowed = await getHierarchyIds(baseOrgId);
      if (!allowed.includes(effectiveRoot)) throw new Error("Forbidden: jurisdiction");
    }
  }

  // For non-superAdmin, scope is hierarchy of baseOrgId; for superAdmin with target, already set.
  // If params.targetOrganizationId not set and not superAdmin, we expand to hierarchy.
  // If superAdmin and no target, expand to hierarchy of baseOrgId (national -> all). That gives national cockpit.
  const hierarchyIds = await getHierarchyIds(effectiveRoot);

  // If filtering to a specific office, keep hierarchyIds but add office filter later.
  const { start, end } = getPeriodDateRange(params.scope, params.year, params.quarter, params.month);

  // Build where conditions
  const whereClauses: any[] = [
    inArray(programmes.organizationId, hierarchyIds),
    gte(programmes.startDate, start),
    lte(programmes.startDate, end),
  ];
  if (params.officeId) whereClauses.push(eq(programmes.organizingOfficeId, params.officeId));

  const progRows = await db
    .select({
      id: programmes.id,
      title: programmes.title,
      startDate: programmes.startDate,
      status: programmes.status,
      level: programmes.level,
      venue: programmes.venue,
      budget: programmes.budget,
      organizationId: programmes.organizationId,
      orgName: organizations.name,
      officeId: programmes.organizingOfficeId,
      officeName: offices.name,
      officialId: programmes.organizingOfficialId,
      officialUserId: officials.userId,
      officialName: users.name,
      reportId: programmeReports.id,
      attendeesMale: programmeReports.attendeesMale,
      attendeesFemale: programmeReports.attendeesFemale,
      amountSpent: programmeReports.amountSpent,
      submittedAt: programmeReports.submittedAt,
      submittedBy: programmeReports.submittedBy,
    })
    .from(programmes)
    .leftJoin(organizations, eq(programmes.organizationId, organizations.id))
    .leftJoin(offices, eq(programmes.organizingOfficeId, offices.id))
    .leftJoin(officials, eq(programmes.organizingOfficialId, officials.id))
    .leftJoin(users, eq(officials.userId, users.id))
    .leftJoin(programmeReports, eq(programmeReports.programmeId, programmes.id))
    .where(and(...whereClauses))
    .orderBy(asc(programmes.startDate));

  // Note: drizzle leftJoin with raw sql alias for submitter is tricky; fallback to second query for names if needed
  // We'll enrich submittedByName via map if null
  const submitterIds = [...new Set(progRows.map((r) => r.submittedBy).filter(Boolean) as string[])];
  let submitterMap = new Map<string, string>();
  if (submitterIds.length) {
    const us = await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, submitterIds));
    us.forEach((u) => submitterMap.set(u.id, u.name ?? ""));
  }

  const details: RollupDetail[] = progRows.map((r) => ({
    id: r.id,
    title: r.title,
    startDate: r.startDate as Date,
    status: (r.status as string) ?? "DRAFT",
    level: (r.level as string) ?? "",
    venue: r.venue as string,
    organizationId: r.organizationId as string,
    organizationName: (r.orgName as string) ?? "",
    officeId: (r.officeId as string) ?? null,
    officeName: (r.officeName as string) ?? (r.officeId ? "Office" : "—"),
    officialId: (r.officialId as string) ?? null,
    officialName: (r.officialName as string) ?? null,
    report: r.reportId
      ? {
          id: r.reportId as string,
          attendeesMale: Number(r.attendeesMale ?? 0),
          attendeesFemale: Number(r.attendeesFemale ?? 0),
          amountSpent: String(r.amountSpent ?? "0.00"),
          submittedAt: r.submittedAt as Date | null,
          submittedByName: r.submittedBy ? submitterMap.get(r.submittedBy as string) ?? null : null,
        }
      : null,
  }));

  // Summaries
  let totalMale = 0, totalFemale = 0, totalSpent = 0, totalBudget = 0;
  let completed = 0, pending = 0, approved = 0, rejected = 0;
  for (const d of details) {
    if (d.report) {
      totalMale += d.report.attendeesMale;
      totalFemale += d.report.attendeesFemale;
      totalSpent += Number(d.report.amountSpent || 0);
    }
    const b = (progRows.find((x) => x.id === d.id)?.budget as any) ?? 0;
    totalBudget += Number(b || 0);
    if (d.status === "COMPLETED") completed++;
    else if (d.status === "APPROVED") approved++;
    else if (d.status === "PENDING_STATE" || d.status === "PENDING_NATIONAL") pending++;
    else if (d.status === "REJECTED") rejected++;
  }
  const totalAttendees = totalMale + totalFemale;
  const summary: RollupSummary = {
    totalProgrammes: details.length,
    completed,
    pending,
    approved,
    rejected,
    totalAttendees,
    totalMale,
    totalFemale,
    totalSpent,
    totalBudget,
    avgAttendance: completed ? Math.round(totalAttendees / completed) : 0,
  };

  // By period breakdown: if monthly scope -> single bucket, but for quarterly/annual/ytd we group
  // For monthly: one entry; for quarterly: group by month; for annual/ytd: group by month or quarter
  const byPeriodMap = new Map<string, ByPeriod>();
  for (const d of details) {
    const dt = d.startDate;
    let key: string;
    if (params.scope === "quarterly" || params.scope === "annual" || params.scope === "ytd") {
      // group by month for granularity
      key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    } else {
      key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    }
    if (!byPeriodMap.has(key)) byPeriodMap.set(key, { period: key, count: 0, completed: 0, attendees: 0, spent: 0 });
    const b = byPeriodMap.get(key)!;
    b.count++;
    if (d.status === "COMPLETED") b.completed++;
    if (d.report) {
      b.attendees += d.report.attendeesMale + d.report.attendeesFemale;
      b.spent += Number(d.report.amountSpent || 0);
    }
  }
  const byPeriod = Array.from(byPeriodMap.values()).sort((a, b) => a.period.localeCompare(b.period));

  // By office
  const byOfficeMap = new Map<string, ByOffice>();
  for (const d of details) {
    const key = d.officeId ?? "__none__";
    const name = d.officeName ?? "Unassigned";
    if (!byOfficeMap.has(key)) byOfficeMap.set(key, { officeId: d.officeId, officeName: name, count: 0, completed: 0, attendees: 0, spent: 0 });
    const o = byOfficeMap.get(key)!;
    o.count++;
    if (d.status === "COMPLETED") o.completed++;
    if (d.report) {
      o.attendees += d.report.attendeesMale + d.report.attendeesFemale;
      o.spent += Number(d.report.amountSpent || 0);
    }
  }
  const byOffice = Array.from(byOfficeMap.values()).sort((a, b) => b.count - a.count);

  const byLevelMap = new Map<string, ByLevel>();
  for (const d of details) {
    const lvl = d.level || "UNKNOWN";
    if (!byLevelMap.has(lvl)) byLevelMap.set(lvl, { level: lvl, count: 0, completed: 0 });
    const l = byLevelMap.get(lvl)!;
    l.count++;
    if (d.status === "COMPLETED") l.completed++;
  }
  const byLevel = Array.from(byLevelMap.values());

  // For national cockpit: aggregate by organization (jurisdiction) as well
  const byOrgMap = new Map<string, { orgId: string; orgName: string; level: string; count: number; completed: number; attendees: number; spent: number }>();
  for (const d of details) {
    const k = d.organizationId;
    if (!byOrgMap.has(k)) byOrgMap.set(k, { orgId: k, orgName: d.organizationName, level: d.level, count: 0, completed: 0, attendees: 0, spent: 0 });
    const o = byOrgMap.get(k)!;
    o.count++;
    if (d.status === "COMPLETED") o.completed++;
    if (d.report) {
      o.attendees += d.report.attendeesMale + d.report.attendeesFemale;
      o.spent += Number(d.report.amountSpent || 0);
    }
  }
  const byOrganization = Array.from(byOrgMap.values()).sort((a, b) => b.count - a.count);

  return {
    summary,
    byPeriod,
    byOffice,
    byLevel,
    byOrganization,
    details,
    meta: { hierarchyIds, start, end, effectiveRoot },
  };
}

export async function getAvailableYears(organizationId?: string) {
  const session = await getServerSession();
  if (!session?.user?.id) return [];
  const years = await db
    .select({ y: sql<number>`YEAR(${programmes.startDate})`.as("y") })
    .from(programmes)
    .groupBy(sql`YEAR(${programmes.startDate})`)
    .orderBy(sql`YEAR(${programmes.startDate}) DESC`)
    .limit(10);
  return years.map((r) => r.y).filter(Boolean);
}

export async function getOfficesForOrg(organizationId: string) {
  return db.select({ id: offices.id, name: offices.name }).from(offices).where(eq(offices.organizationId, organizationId));
}

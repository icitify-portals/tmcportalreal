export type ReportScope = "monthly" | "quarterly" | "annual" | "ytd";

export interface PeriodInfo {
  year: number;
  quarter: 1 | 2 | 3 | 4;
  month: number; // 1-12
  periodMonthly: string; // YYYY-MM
  periodQuarterly: string; // YYYY-Qn
  periodAnnual: string; // YYYY
}

export function getReportPeriod(date: Date): PeriodInfo {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const quarter = (Math.floor((month - 1) / 3) + 1) as 1 | 2 | 3 | 4;
  return {
    year,
    quarter,
    month,
    periodMonthly: `${year}-${String(month).padStart(2, "0")}`,
    periodQuarterly: `${year}-Q${quarter}`,
    periodAnnual: `${year}`,
  };
}

export function getPeriodDateRange(
  scope: ReportScope,
  year: number,
  quarter?: number,
  month?: number
): { start: Date; end: Date; label: string } {
  if (scope === "monthly" && month) {
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { start, end, label: `${year}-${String(month).padStart(2, "0")}` };
  }
  if (scope === "quarterly" && quarter) {
    const q = quarter as number;
    const startMonth = (q - 1) * 3;
    const start = new Date(year, startMonth, 1, 0, 0, 0, 0);
    const end = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
    return { start, end, label: `${year}-Q${q}` };
  }
  if (scope === "annual") {
    const start = new Date(year, 0, 1, 0, 0, 0, 0);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);
    return { start, end, label: `${year}` };
  }
  if (scope === "ytd") {
    const start = new Date(year, 0, 1, 0, 0, 0, 0);
    const end = new Date();
    // clamp to current year
    if (end.getFullYear() !== year) {
      const e = new Date(year, 11, 31, 23, 59, 59, 999);
      return { start, end: e, label: `${year} YTD` };
    }
    return { start, end, label: `${year} YTD (to ${end.toLocaleDateString()})` };
  }
  // fallback annual
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  return { start, end, label: `${year}` };
}

export function getQuarterMonths(quarter: number): number[] {
  const s = (quarter - 1) * 3 + 1;
  return [s, s + 1, s + 2];
}

export function formatPeriodLabel(scope: ReportScope, year: number, quarter?: number, month?: number) {
  if (scope === "monthly" && month) return `${year}-${String(month).padStart(2, "0")}`;
  if (scope === "quarterly" && quarter) return `${year}-Q${quarter}`;
  if (scope === "annual") return `${year}`;
  if (scope === "ytd") return `${year} YTD`;
  return `${year}`;
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function monthName(month: number) {
  return MONTH_NAMES[month - 1] ?? "";
}

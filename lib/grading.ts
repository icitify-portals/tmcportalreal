export type GradeLetter = "A" | "B" | "C" | "D" | "F";

export interface GradingWeights {
  completion: number; // 0.30
  punctuality: number; // 0.20
  attendance: number; // 0.25
  budgetDiscipline: number; // 0.15
  quality: number; // 0.10
}

export const DEFAULT_WEIGHTS: GradingWeights = {
  completion: 0.30,
  punctuality: 0.20,
  attendance: 0.25,
  budgetDiscipline: 0.15,
  quality: 0.10,
};

export interface GradeBreakdown {
  completion: number; // 0-100
  punctuality: number;
  attendance: number;
  budgetDiscipline: number;
  quality: number;
  weightedScore: number; // 0-100
  grade: GradeLetter;
}

export function scoreToGrade(score: number): GradeLetter {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  if (score >= 35) return "D";
  return "F";
}

export function gradeColor(letter: GradeLetter): string {
  switch (letter) {
    case "A": return "bg-emerald-600";
    case "B": return "bg-green-500";
    case "C": return "bg-yellow-500";
    case "D": return "bg-orange-500";
    case "F": return "bg-red-600";
  }
}

export function computeProgrammeGrade(input: {
  status: string;
  isLateSubmission?: boolean | null;
  report?: {
    attendeesMale?: number | null;
    attendeesFemale?: number | null;
    summary?: string | null;
    images?: any;
    lecturers?: string | null;
    topic?: string | null;
    submittedAt?: Date | string | null;
  } | null;
  endDate?: Date | string | null;
  startDate?: Date | string | null;
  budget?: string | number | null;
  amountSpent?: string | number | null;
  targetAttendees?: number; // optional expected
  weights?: GradingWeights;
}): GradeBreakdown {
  const w = input.weights ?? DEFAULT_WEIGHTS;

  // 1. Completion 0/100
  const completion = input.status === "COMPLETED" ? 100 : input.status === "APPROVED" ? 60 : input.status?.startsWith("PENDING") ? 30 : 0;

  // 2. Punctuality: report submitted within 7d after end, not lateSubmission
  let punctuality = 0;
  if (!input.report) punctuality = 0;
  else if (input.isLateSubmission) punctuality = 40;
  else if (!input.report.submittedAt || !input.endDate) punctuality = 70;
  else {
    const diffDays = (new Date(input.report.submittedAt).getTime() - new Date(input.endDate).getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays <= 1) punctuality = 100;
    else if (diffDays <= 3) punctuality = 80;
    else if (diffDays <= 7) punctuality = 60;
    else if (diffDays <= 14) punctuality = 30;
    else punctuality = 10;
  }

  // 3. Attendance: vs target or vs heuristic (budget implied)
  let attendance = 0;
  if (!input.report) attendance = 0;
  else {
    const total = Number(input.report.attendeesMale ?? 0) + Number(input.report.attendeesFemale ?? 0);
    const target = input.targetAttendees ?? 80; // heuristic baseline
    attendance = Math.min(100, Math.round((total / target) * 100));
    if (total === 0) attendance = 0;
  }

  // 4. Budget discipline: spent vs budget within 15% = 100, within 30% = 70, etc.
  let budgetDiscipline = 0;
  const budget = Number(input.budget ?? 0);
  const spent = Number(input.amountSpent ?? 0);
  if (budget <= 0 && spent <= 0) budgetDiscipline = 70; // no budget = neutral
  else if (budget > 0) {
    const variance = Math.abs(spent - budget) / budget;
    if (variance <= 0.15) budgetDiscipline = 100;
    else if (variance <= 0.3) budgetDiscipline = 75;
    else if (variance <= 0.5) budgetDiscipline = 50;
    else budgetDiscipline = 20;
  } else if (spent > 0) budgetDiscipline = 40;

  // 5. Quality: summary length + lecturers/topic + images
  let quality = 0;
  if (!input.report) quality = 0;
  else {
    let q = 0;
    if ((input.report.summary ?? "").length > 80) q += 40;
    else if ((input.report.summary ?? "").length > 30) q += 20;
    if (input.report.lecturers && input.report.topic) q += 30;
    else if (input.report.lecturers || input.report.topic) q += 15;
    const imgCount = Array.isArray(input.report.images) ? input.report.images.length : 0;
    if (imgCount >= 2) q += 30;
    else if (imgCount === 1) q += 15;
    quality = Math.min(100, q);
  }

  const weightedScore = Math.round(
    completion * w.completion +
      punctuality * w.punctuality +
      attendance * w.attendance +
      budgetDiscipline * w.budgetDiscipline +
      quality * w.quality
  );

  return {
    completion,
    punctuality,
    attendance,
    budgetDiscipline,
    quality,
    weightedScore,
    grade: scoreToGrade(weightedScore),
  };
}

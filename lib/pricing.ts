export interface EarlyBirdFields {
  amount?: string | number | null;
  earlyBirdAmount?: string | number | null;
  earlyBirdDeadline?: string | Date | null;
}

export function getEffectiveAmount(p: EarlyBirdFields, now: Date = new Date()): number {
  const normal = Number(p.amount ?? 0);
  const eb = p.earlyBirdAmount != null ? Number(p.earlyBirdAmount) : null;
  if (eb != null && p.earlyBirdDeadline) {
    const deadline = new Date(p.earlyBirdDeadline);
    // inclusive till deadline end of day if date only, but we treat exact timestamp
    if (now.getTime() <= deadline.getTime()) return eb;
  }
  return normal;
}

export function isEarlyBirdActive(p: EarlyBirdFields, now: Date = new Date()): boolean {
  if (p.earlyBirdAmount == null || !p.earlyBirdDeadline) return false;
  return now.getTime() <= new Date(p.earlyBirdDeadline).getTime();
}

export function formatEarlyBirdLabel(p: EarlyBirdFields): string | null {
  if (p.earlyBirdAmount == null || !p.earlyBirdDeadline) return null;
  const d = new Date(p.earlyBirdDeadline);
  const eb = Number(p.earlyBirdAmount).toLocaleString();
  const normal = Number(p.amount ?? 0).toLocaleString();
  return `Early bird ₦${eb} till ${d.toLocaleDateString()} → ₦${normal} after`;
}

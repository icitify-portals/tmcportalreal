export interface EarlyBirdTierInput {
  amount?: string | number | null;
  startAt?: string | Date | null;
  endAt?: string | Date | null;
  label?: string | null;
}

export interface EarlyBirdFields {
  amount?: string | number | null;
  earlyBirdAmount?: string | number | null;
  earlyBirdDeadline?: string | Date | null;
  tiers?: EarlyBirdTierInput[] | null;
}

export interface ActiveEarlyBird {
  amount: number;
  label: string | null;
  startAt: Date | null;
  endAt: Date | null;
  /** EB window end that the price is valid until (null = open-ended tier) */
  deadline: Date | null;
}

function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * A date-only early-bird deadline / window end (e.g. "25 Sept") must be inclusive
 * through the END of that day (23:59:59.999), not expire at the start of it.
 * Date-only values arrive as midnight (from `<input type="date">` → UTC midnight,
 * or a local-midnight Date). Explicit timestamps (with a real time) are preserved.
 */
function inclusiveEndOfDay(v: Date | null): Date | null {
  if (!v) return null;
  const isMidnightUTC = v.getUTCHours() === 0 && v.getUTCMinutes() === 0 && v.getUTCSeconds() === 0 && v.getUTCMilliseconds() === 0;
  const isMidnightLocal = v.getHours() === 0 && v.getMinutes() === 0 && v.getSeconds() === 0 && v.getMilliseconds() === 0;
  if (isMidnightUTC || isMidnightLocal) {
    return new Date(v.getTime() + 24 * 3600 * 1000 - 1); // end of that same day
  }
  return v;
}

/** The currently active early bird window (tier first, legacy single-EB fallback). */
export function getActiveEarlyBird(p: EarlyBirdFields, now: Date = new Date()): ActiveEarlyBird | null {
  const tiers = (p.tiers || [])
    .map((t, i) => ({
      amount: t.amount != null ? Number(t.amount) : NaN,
      label: t.label || `Early bird ${i + 1}`,
      startAt: toDate(t.startAt),
      endAt: inclusiveEndOfDay(toDate(t.endAt)),
    }))
    .filter((t) => !isNaN(t.amount) && t.amount > 0);

  const active = tiers.filter(
    (t) => (!t.startAt || now.getTime() >= t.startAt.getTime()) && (!t.endAt || now.getTime() <= t.endAt.getTime())
  );
  if (active.length > 0) {
    // Deterministic when windows overlap: the one ending soonest wins
    active.sort((a, b) => (a.endAt ? a.endAt.getTime() : Infinity) - (b.endAt ? b.endAt.getTime() : Infinity));
    const t = active[0];
    return { amount: t.amount, label: t.label, startAt: t.startAt, endAt: t.endAt, deadline: t.endAt };
  }

  const eb = p.earlyBirdAmount != null ? Number(p.earlyBirdAmount) : null;
  const deadline = inclusiveEndOfDay(toDate(p.earlyBirdDeadline));
  if (eb != null && deadline && now.getTime() <= deadline.getTime()) {
    return { amount: eb, label: null, startAt: null, endAt: deadline, deadline };
  }
  return null;
}

export function getEffectiveAmount(p: EarlyBirdFields, now: Date = new Date()): number {
  const normal = Number(p.amount ?? 0);
  const active = getActiveEarlyBird(p, now);
  if (active) return active.amount;
  return normal;
}

export function isEarlyBirdActive(p: EarlyBirdFields, now: Date = new Date()): boolean {
  return getActiveEarlyBird(p, now) != null;
}

export function formatEarlyBirdLabel(p: EarlyBirdFields): string | null {
  const active = getActiveEarlyBird(p);
  if (!active) {
    if (p.earlyBirdAmount == null || !p.earlyBirdDeadline) return null;
    return null;
  }
  const eb = Number(active.amount).toLocaleString();
  const normal = Number(p.amount ?? 0).toLocaleString();
  if (active.endAt) {
    const prefix = active.label ? `${active.label} ` : "Early bird ";
    return `${prefix}₦${eb} till ${active.endAt.toLocaleDateString()} → ₦${normal} after`;
  }
  const prefix = active.label ? `${active.label} ` : "Early bird ";
  return `${prefix}₦${eb} (normal ₦${normal})`;
}

/** Human-readable schedule of all windows, e.g. "First early bird: ₦17,000 (20 Sep – 25 Sep)". */
export function formatTierWindows(tiers: EarlyBirdTierInput[] | null | undefined): string[] {
  if (!tiers || tiers.length === 0) return [];
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return tiers
    .map((t, i) => {
      const amount = t.amount != null ? Number(t.amount) : NaN;
      if (isNaN(amount)) return null;
      const label = t.label || `Early bird ${i + 1}`;
      const s = toDate(t.startAt);
      const e = toDate(t.endAt);
      const when = s && e ? ` (${fmt(s)} – ${fmt(e)})` : e ? ` (till ${fmt(e)})` : s ? ` (from ${fmt(s)})` : "";
      return `${label}: ₦${amount.toLocaleString()}${when}`;
    })
    .filter(Boolean) as string[];
}

export interface PayableInput extends EarlyBirdFields {
  lockedAmount?: string | number | null;
  lockedEarlyBirdDeadline?: string | Date | null;
  amountPaid?: string | number | null;
}

/**
 * What a registration must pay in TOTAL right now.
 * - Default: locked price (set at registration), else current effective price.
 * - EB completion rule: if the locked price was an early-bird discount whose
 *   window has passed AND a balance remains, the lock is lifted and the total
 *   reprices to the normal fee (ebExpiredReprice: true).
 */
export function resolvePayableTotal(
  p: PayableInput,
  now: Date = new Date()
): { total: number; ebExpiredReprice: boolean; ebDeadline: Date | null } {
  const normal = Number(p.amount ?? 0);
  const locked = p.lockedAmount != null && p.lockedAmount !== "" ? Number(p.lockedAmount) : null;
  const paid = Number(p.amountPaid ?? 0);
  const base = locked ?? getEffectiveAmount(p, now);
  const ebDeadline = inclusiveEndOfDay(toDate(p.lockedEarlyBirdDeadline));

  if (
    locked != null &&
    ebDeadline &&
    now.getTime() > ebDeadline.getTime() &&
    locked < normal &&
    base - paid > 0
  ) {
    return { total: normal, ebExpiredReprice: true, ebDeadline };
  }
  return { total: base, ebExpiredReprice: false, ebDeadline };
}

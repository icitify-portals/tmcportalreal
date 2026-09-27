"use server";

import { db } from "@/lib/db";
import { programmes, programmeEarlyBirdTiers } from "@/lib/db/schema";
import { eq, inArray, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/session";
import { v4 as uuidv4 } from "uuid";

export interface EarlyBirdTierInput {
    label?: string | null;
    startAt?: string | Date | null;
    endAt?: string | Date | null;
    amount: number | string;
}

export function validateEarlyBirdTiers(tiers: EarlyBirdTierInput[] | undefined | null): { valid: boolean; error?: string } {
    if (!tiers || tiers.length === 0) return { valid: true };
    if (tiers.length > 10) return { valid: false, error: "At most 10 early bird windows allowed" };
    for (let i = 0; i < tiers.length; i++) {
        const t = tiers[i];
        const amount = Number(String(t.amount).replace(/,/g, ""));
        if (!amount || isNaN(amount) || amount <= 0) {
            return { valid: false, error: `Early bird window ${i + 1}: amount must be greater than 0` };
        }
        const s = t.startAt ? new Date(t.startAt) : null;
        const e = t.endAt ? new Date(t.endAt) : null;
        if ((s && isNaN(s.getTime())) || (e && isNaN(e.getTime()))) {
            return { valid: false, error: `Early bird window ${i + 1}: invalid date` };
        }
        if (s && e && e.getTime() < s.getTime()) {
            return { valid: false, error: `Early bird window ${i + 1}: end date must be after start date` };
        }
    }
    return { valid: true };
}

/** Replace all tiers of a programme (used by create/update flows). */
export async function replaceEarlyBirdTiers(programmeId: string, tiers: EarlyBirdTierInput[] | undefined | null) {
    const session = await getServerSession();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const check = validateEarlyBirdTiers(tiers);
    if (!check.valid) return { success: false, error: check.error };

    const [prog] = await db.select({ id: programmes.id }).from(programmes).where(eq(programmes.id, programmeId)).limit(1);
    if (!prog) return { success: false, error: "Programme not found" };

    await db.delete(programmeEarlyBirdTiers).where(eq(programmeEarlyBirdTiers.programmeId, programmeId));

    const clean = (tiers || []).filter((t) => Number(String(t.amount).replace(/,/g, "")) > 0);
    if (clean.length > 0) {
        await db.insert(programmeEarlyBirdTiers).values(
            clean.map((t, i) => ({
                id: uuidv4(),
                programmeId,
                label: t.label?.toString().slice(0, 100) || `Early bird ${i + 1}`,
                startAt: t.startAt ? new Date(t.startAt) : null,
                endAt: t.endAt ? new Date(t.endAt) : null,
                amount: Number(String(t.amount).replace(/,/g, "")).toFixed(2) as any,
                sortOrder: i,
                createdAt: new Date(),
                updatedAt: new Date(),
            }))
        );
    }

    revalidatePath("/dashboard/admin/programmes");
    revalidatePath("/programmes");
    return { success: true };
}

export async function getEarlyBirdTiers(programmeId: string) {
    return db
        .select()
        .from(programmeEarlyBirdTiers)
        .where(eq(programmeEarlyBirdTiers.programmeId, programmeId))
        .orderBy(asc(programmeEarlyBirdTiers.sortOrder), asc(programmeEarlyBirdTiers.startAt));
}

/** Batch fetch for list pages: { [programmeId]: tiers[] } */
export async function getEarlyBirdTiersForProgrammes(programmeIds: string[]): Promise<Record<string, typeof programmeEarlyBirdTiers.$inferSelect[]>> {
    if (!programmeIds.length) return {};
    const rows = await db
        .select()
        .from(programmeEarlyBirdTiers)
        .where(inArray(programmeEarlyBirdTiers.programmeId, programmeIds))
        .orderBy(asc(programmeEarlyBirdTiers.sortOrder), asc(programmeEarlyBirdTiers.startAt));
    const map: Record<string, typeof programmeEarlyBirdTiers.$inferSelect[]> = {};
    for (const r of rows) {
        (map[r.programmeId] ||= []).push(r);
    }
    return map;
}

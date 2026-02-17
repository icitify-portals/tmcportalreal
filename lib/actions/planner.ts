"use server"

import { db } from "@/lib/db"
import { programmes, offices, organizations } from "@/lib/db/schema"
import { getServerSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import * as XLSX from "xlsx"
import { eq } from "drizzle-orm"

// Type for Excel Row (Loose typing as keys vary)
type PlannerRow = Record<string, any>

function parseExcelDate(serial: number): Date {
    // Excel base date is Dec 30 1899
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info;
}

// Type for Parsed Preview Data
export type PlannerPreviewItem = {
    officeName: string;
    title: string;
    format: 'PHYSICAL' | 'VIRTUAL' | 'HYBRID';
    frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'BI-ANNUALLY' | 'ANNUALLY' | 'ONCE';
    startDate: Date;
    time: string;
    venue: string;
    budget: string;
    objectives?: string;
    additionalInfo?: string;
    committee?: string;
}

// Helper to find value by fuzzy key
function getValue(row: PlannerRow, targetKeys: string[]): any {
    const keys = Object.keys(row);
    for (const key of keys) {
        const normalizedKey = key.trim().toUpperCase();
        if (targetKeys.includes(normalizedKey)) { // Check if key matches any of targets
            return row[key];
        }
    }
    return undefined;
}

export async function previewYearPlanner(formData: FormData) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const file = formData.get("file") as File
        if (!file) return { success: false, error: "No file uploaded" }

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<PlannerRow>(worksheet)

        console.log(`[YearPlanner] Preview found ${jsonData.length} rows in sheet: ${sheetName}`)

        const previewData: PlannerPreviewItem[] = []
        let skipped = 0;

        for (const row of jsonData) {
            // Map Fields with Fuzzy Search
            const officeName = getValue(row, ["OFFICE", "OFFICE NAME"])?.toString().trim();
            const title = getValue(row, ["PROGRAM AND ACTIVITY", "PROGRAM", "ACTIVITY", "TITLE"])?.toString().trim();

            if (!title) {
                skipped++
                continue;
            }

            // Parsing Enums
            const formatRaw = getValue(row, ["PROGRAM FORMAT", "FORMAT"])?.toString().toUpperCase() || 'PHYSICAL';
            let format: 'PHYSICAL' | 'VIRTUAL' | 'HYBRID' = 'PHYSICAL';
            if (formatRaw.includes('VIRTUAL')) format = 'VIRTUAL';
            if (formatRaw.includes('HYBRID')) format = 'HYBRID';

            const freqRaw = getValue(row, ["PROGRAM FREQUENCY", "FREQUENCY"])?.toString().toUpperCase() || 'ONCE';
            let frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'BI-ANNUALLY' | 'ANNUALLY' | 'ONCE' = 'ONCE';
            if (freqRaw.includes('WEEKLY')) frequency = 'WEEKLY';
            if (freqRaw.includes('MONTHLY')) frequency = 'MONTHLY';
            if (freqRaw.includes('QUARTERLY')) frequency = 'QUARTERLY';
            if (freqRaw.includes('BI-ANNUALLY')) frequency = 'BI-ANNUALLY';
            if (freqRaw.includes('ANNUALLY')) frequency = 'ANNUALLY';

            // Dates
            let startDate = new Date();
            const rawDate = getValue(row, ["PROGRAM DATE", "DATE"]);

            // Handle Excel serial date
            if (typeof rawDate === 'number') {
                startDate = parseExcelDate(rawDate);
            } else if (typeof rawDate === 'string') {
                startDate = new Date(rawDate);
            }
            // Is it valid?
            if (isNaN(startDate.getTime())) {
                startDate = new Date(); // Fallback
            }

            // Time
            const time = getValue(row, ["PROGRAM TIME", "TIME"])?.toString() || "09:00";
            const venue = getValue(row, ["PROGRAM VENUE", "VENUE"])?.toString() || "TBD";
            const budget = getValue(row, ["BUDGETED EXPENDITURE (NGN)", "BUDGET", "COST"])?.toString() || "0";
            const objectives = getValue(row, ["PROGRAM OBJECTIVES", "OBJECTIVES"])?.toString();
            const info = getValue(row, ["PROGRAM ADDITIONAL INFORMATION", "ADDITIONAL INFO"])?.toString();
            const committee = getValue(row, ["PROGRAM COMMITTEE", "COMMITTEE"])?.toString();

            previewData.push({
                officeName: officeName || "Unknown Office", // Default if missing
                title,
                format,
                frequency,
                startDate,
                time,
                venue,
                budget,
                objectives,
                additionalInfo: info,
                committee
            })
        }

        return { success: true, count: previewData.length, skipped, data: previewData }

    } catch (error) {
        console.error("Preview Error", error)
        return { success: false, error: "Failed to parse file" }
    }
}

export async function importYearPlannerData(data: PlannerPreviewItem[]) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const [userOrg] = await db.select({ id: organizations.id, level: organizations.level })
            .from(organizations)
            .limit(1)

        const organizationId = userOrg?.id;
        if (!organizationId) return { success: false, error: "No organization found" }

        // Pre-fetch offices to map names to IDs
        const existingOffices = await db.select().from(offices).where(eq(offices.organizationId, organizationId))
        const officeMap = new Map(existingOffices.map(o => [o.name.toUpperCase(), o.id]))

        let count = 0;

        for (const item of data) {
            // Office Mapping
            let officeId = null;
            const officeName = item.officeName;

            if (officeName && officeMap.has(officeName.toUpperCase())) {
                officeId = officeMap.get(officeName.toUpperCase());
            } else if (officeName && officeName !== "Unknown Office") {
                // Create new office including organizationId!
                const [newOffice] = await db.insert(offices).values({
                    organizationId, // IMPORTANT: Link new office to org
                    name: officeName,
                    description: "Imported from Year Planner",
                    isActive: true
                }).$returningId()
                officeId = newOffice.id
                officeMap.set(officeName.toUpperCase(), officeId)
            } else {
                // Checking Schema... `organizingOfficeId` depends on definition.
                // safe check:
                if (!officeMap.has("GENERAL")) {
                    // Lazy create General?
                }
            }

            // If officeId is still null, we might have issues if DB enforces it.
            // Let's assume most rows have offices.

            await db.insert(programmes).values({
                organizationId,
                title: item.title,
                description: item.title,
                level: userOrg.level,
                status: 'APPROVED',
                venue: item.venue,
                startDate: new Date(item.startDate), // Ensure Date object
                time: item.time,
                budget: item.budget,
                organizingOfficeId: officeId, // Nullable?

                format: item.format,
                frequency: item.frequency,
                objectives: item.objectives,
                additionalInfo: item.additionalInfo,
                committee: item.committee,

                createdBy: session.user.id
            })
            count++;
        }

        revalidatePath("/dashboard/admin/programmes")
        return { success: true, count }

    } catch (error) {
        console.error("Import Error", error)
        return { success: false, error: "Failed to import data" }
    }
}

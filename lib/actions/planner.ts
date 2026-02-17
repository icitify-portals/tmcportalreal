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

export async function uploadYearPlanner(formData: FormData) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        // Determine user's organization
        // Default to a placeholder lookup for "National Headquarters" if not found.
        const [userOrg] = await db.select({ id: organizations.id, level: organizations.level })
            .from(organizations)
            // This join logic is complex without direct user->org link in session sometimes.
            // Let's assume we use the first org found for now or hardcode for dev.
            .limit(1)

        const organizationId = userOrg?.id;
        if (!organizationId) return { success: false, error: "No organization found" }


        const file = formData.get("file") as File
        if (!file) return { success: false, error: "No file uploaded" }

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<PlannerRow>(worksheet)

        console.log(`[YearPlanner] Found ${jsonData.length} rows in sheet: ${sheetName}`)
        if (jsonData.length > 0) {
            console.log(`[YearPlanner] Headers:`, Object.keys(jsonData[0]))
        }

        // Pre-fetch offices to map names to IDs
        const existingOffices = await db.select().from(offices).where(eq(offices.organizationId, organizationId))
        const officeMap = new Map(existingOffices.map(o => [o.name.toUpperCase(), o.id]))

        let count = 0;
        let skipped = 0;

        for (const row of jsonData) {
            // Map Fields with Fuzzy Search
            const officeName = getValue(row, ["OFFICE", "OFFICE NAME"])?.toString().trim();
            const title = getValue(row, ["PROGRAM AND ACTIVITY", "PROGRAM", "ACTIVITY", "TITLE"])?.toString().trim();

            if (!title) {
                console.log(`[YearPlanner] Skipping row due to missing title:`, row)
                skipped++
                continue;
            }

            // Office Mapping
            let officeId = null;
            if (officeName && officeMap.has(officeName.toUpperCase())) {
                officeId = officeMap.get(officeName.toUpperCase());
            } else if (officeName) {
                // Create new office including organizationId!
                const [newOffice] = await db.insert(offices).values({
                    organizationId, // IMPORTANT: Link new office to org
                    name: officeName,
                    description: "Imported from Year Planner",
                    isActive: true
                }).$returningId()
                officeId = newOffice.id
                officeMap.set(officeName.toUpperCase(), officeId)
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
                console.warn(`[YearPlanner] Invalid date for "${title}": ${rawDate}. Using current date.`)
                startDate = new Date(); // Fallback
            }

            // Time
            const time = getValue(row, ["PROGRAM TIME", "TIME"])?.toString() || "09:00";
            const venue = getValue(row, ["PROGRAM VENUE", "VENUE"])?.toString() || "TBD";
            const budget = getValue(row, ["BUDGETED EXPENDITURE (NGN)", "BUDGET", "COST"])?.toString() || "0";
            const objectives = getValue(row, ["PROGRAM OBJECTIVES", "OBJECTIVES"])?.toString();
            const info = getValue(row, ["PROGRAM ADDITIONAL INFORMATION", "ADDITIONAL INFO"])?.toString();
            const committee = getValue(row, ["PROGRAM COMMITTEE", "COMMITTEE"])?.toString();

            await db.insert(programmes).values({
                organizationId,
                title: title,
                description: title,
                level: userOrg.level,
                status: 'APPROVED',
                venue: venue,
                startDate: startDate,
                time: time,
                budget: budget,
                organizingOfficeId: officeId as string,

                // New Fields
                format: format,
                frequency: frequency,
                objectives: objectives,
                additionalInfo: info,
                committee: committee,

                createdBy: session.user.id
            })
            count++;
        }

        console.log(`[YearPlanner] Import complete. Success: ${count}, Skipped: ${skipped}`)
        revalidatePath("/dashboard/admin/programmes")
        return { success: true, count, skipped }

    } catch (error) {
        console.error("Upload Error", error)
        return { success: false, error: "Failed to process file" }
    }
}

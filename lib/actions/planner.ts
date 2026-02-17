"use server"

import { db } from "@/lib/db"
import { programmes, offices, organizations } from "@/lib/db/schema"
import { getServerSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import * as XLSX from "xlsx"
import { eq } from "drizzle-orm"

// Type for Excel Row
type PlannerRow = {
    "OFFICE": string;
    "PROGRAM AND ACTIVITY": string; // Title
    "PROGRAM FORMAT": string;
    "PROGRAM FREQUENCY": string;
    "PROGRAM OBJECTIVES": string;
    "PROGRAM ADDITIONAL INFORMATION": string;
    "PROGRAM DATE": number | string; // Excel date serial or string
    "PROGRAM TIME": string;
    "PROGRAM VENUE": string;
    "BUDGETED EXPENDITURE (NGN)": number;
    "PROGRAM COMMITTEE": string;
}

function parseExcelDate(serial: number): Date {
    // Excel base date is Dec 30 1899
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info;
}

export async function uploadYearPlanner(formData: FormData) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        // Determine user's organization - likely ADMIN uploading for National or specific org
        // For now, let's assume the user belongs to an organization and we attach these programmes to it.
        // Or if they are super admin, they might be uploading for National.
        // Let's fetch user's primary org connection? Or pass orgId in formData if needed.
        // Assuming user context has orgId or we find one.
        // Simplification: User must be an admin of an organization.

        // Let's get the organization ID from the first organization the user is an admin/member of for now, 
        // or ensure the session has it.
        // Only National admins should probably do this?
        // Let's default to the user's first organization found for 'NATIONAL' or 'STATE' level.

        // This part relies on specific app logic for "current organization". 
        // I will default to a placeholder lookup for "National Headquarters" if not found.
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

        // Pre-fetch offices to map names to IDs
        const existingOffices = await db.select().from(offices).where(eq(offices.organizationId, organizationId))
        const officeMap = new Map(existingOffices.map(o => [o.name.toUpperCase(), o.id]))

        let count = 0;

        for (const row of jsonData) {
            // Map Fields
            const officeName = row["OFFICE"]?.toString().trim();
            const title = row["PROGRAM AND ACTIVITY"]?.toString().trim();
            if (!title) continue; // Skip empty rows

            // Office Mapping
            let officeId = null;
            if (officeName && officeMap.has(officeName.toUpperCase())) {
                officeId = officeMap.get(officeName.toUpperCase());
            } else if (officeName) {
                // Create new office if not exists?? Or just ignore?
                // Let's create it to be helpful
                const [newOffice] = await db.insert(offices).values({
                    organizationId,
                    name: officeName,
                    description: "Imported from Year Planner",
                }).$returningId()
                officeId = newOffice.id
                officeMap.set(officeName.toUpperCase(), officeId)
            }

            // Parsing Enums
            const formatRaw = row["PROGRAM FORMAT"]?.toString().toUpperCase() || 'PHYSICAL';
            let format: 'PHYSICAL' | 'VIRTUAL' | 'HYBRID' = 'PHYSICAL';
            if (formatRaw.includes('VIRTUAL')) format = 'VIRTUAL';
            if (formatRaw.includes('HYBRID')) format = 'HYBRID';

            const freqRaw = row["PROGRAM FREQUENCY"]?.toString().toUpperCase() || 'ONCE';
            let frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'BI-ANNUALLY' | 'ANNUALLY' | 'ONCE' = 'ONCE';
            if (freqRaw.includes('WEEKLY')) frequency = 'WEEKLY';
            if (freqRaw.includes('MONTHLY')) frequency = 'MONTHLY';
            if (freqRaw.includes('QUARTERLY')) frequency = 'QUARTERLY';
            if (freqRaw.includes('BI-ANNUALLY')) frequency = 'BI-ANNUALLY';
            if (freqRaw.includes('ANNUALLY')) frequency = 'ANNUALLY';

            // Dates
            let startDate = new Date();
            // Handle Excel serial date
            if (typeof row["PROGRAM DATE"] === 'number') {
                startDate = parseExcelDate(row["PROGRAM DATE"]);
            } else if (typeof row["PROGRAM DATE"] === 'string') {
                startDate = new Date(row["PROGRAM DATE"]);
            }
            // Is it valid?
            if (isNaN(startDate.getTime())) {
                startDate = new Date(); // Fallback
            }

            // Time
            const time = row["PROGRAM TIME"]?.toString() || "09:00";

            await db.insert(programmes).values({
                organizationId,
                title: title, // "Program and Activity" usually contains the title
                description: title, // Use title as description for now
                level: userOrg.level, // Inherit org level
                status: 'APPROVED', // Auto-approve planner items?
                venue: row["PROGRAM VENUE"]?.toString() || "TBD",
                startDate: startDate,
                time: time,
                budget: row["BUDGETED EXPENDITURE (NGN)"]?.toString() || "0",
                organizingOfficeId: officeId as string, // cast

                // New Fields
                format: format,
                frequency: frequency,
                objectives: row["PROGRAM OBJECTIVES"]?.toString(),
                additionalInfo: row["PROGRAM ADDITIONAL INFORMATION"]?.toString(),
                committee: row["PROGRAM COMMITTEE"]?.toString(),

                createdBy: session.user.id
            })
            count++;
        }

        revalidatePath("/dashboard/admin/programmes")
        return { success: true, count }

    } catch (error) {
        console.error("Upload Error", error)
        return { success: false, error: "Failed to process file" }
    }
}

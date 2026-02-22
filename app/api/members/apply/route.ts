import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { members, organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { getMembershipSettings } from "@/lib/actions/settings"

// Schema matching the detailed form from page.tsx
const applySchema = z.object({
    fullName: z.string(),
    country: z.string(),
    state: z.string(),
    local_government_area: z.string(),
    branch: z.string(),
    date_of_birth: z.string(),
    state_of_origin: z.string(),
    lga_of_origin: z.string(),
    whatsapp_number: z.string(),
    maritalStatus: z.enum(["SINGLE", "MARRIED"]),
    dateOfMarriage: z.string().optional(),
    numChildrenMale: z.coerce.number().optional(),
    numChildrenFemale: z.coerce.number().optional(),
    phone: z.string(),
    emergencyContactName: z.string(),
    emergencyContactPhone: z.string(),
    occupation: z.string(),
    qualification: z.string(),
    specialization: z.string(),
    years_of_experience: z.coerce.number(),
    membership_duration: z.coerce.number(),
    educationHistory: z.array(z.object({
        institution: z.string(),
        course: z.string(),
        degreeClass: z.string(),
        yearAdmitted: z.coerce.number(),
        yearGraduated: z.coerce.number(),
    })).optional(),
    blood_group: z.string().optional(),
    genotype: z.string().optional(),
    specific_ailment: z.string().optional(),
    hospital: z.string().optional(),
    doctorName: z.string().optional(),
    doctorPhone: z.string().optional(),
})

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession() // Keep original session handling for now, as `auth()` is not defined in this context.
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const data = await request.json()
        const validData = applySchema.parse(data)

        // 0. Check if membership registration is enabled
        const settings = await getMembershipSettings()
        if (!settings.registrationEnabled) {
            return NextResponse.json(
                { error: "Public membership registration is currently closed. Please contact an admin." },
                { status: 403 }
            )
        }

        const userId = session.user.id

        // 1. Check if user is already a member
        const existingMember = await db.query.members.findFirst({
            where: eq(members.userId, userId),
        })

        if (existingMember) {
            return NextResponse.json(
                { error: "You have already submitted an application" },
                { status: 400 }
            )
        }

        // 2. Get organization based on selection
        let organization = null;

        // Try to find EXACT Branch match first
        if (validData.branch) {
            organization = await db.query.organizations.findFirst({
                where: (organizations, { eq, and }) =>
                    and(
                        eq(organizations.level, "BRANCH"),
                        eq(organizations.name, validData.branch)
                    )
            })

            // If no exact match, try fuzzy branch (only if branch was provided)
            if (!organization) {
                organization = await db.query.organizations.findFirst({
                    where: (organizations, { eq, and, like }) =>
                        and(
                            eq(organizations.level, "BRANCH"),
                            like(organizations.name, `%${validData.branch}%`)
                        )
                })
            }
        }

        // If still no organization, try LGA
        if (!organization && validData.local_government_area) {
            organization = await db.query.organizations.findFirst({
                where: (organizations, { eq, and, or, like }) =>
                    and(
                        eq(organizations.level, "LOCAL_GOVERNMENT"),
                        or(
                            eq(organizations.name, validData.local_government_area),
                            like(organizations.name, `%${validData.local_government_area}%`)
                        )
                    )
            })
        }

        // If still no organization, try State
        if (!organization && validData.state) {
            organization = await db.query.organizations.findFirst({
                where: (organizations, { eq, and, or, like }) =>
                    and(
                        eq(organizations.level, "STATE"),
                        or(
                            eq(organizations.name, validData.state),
                            like(organizations.name, `%${validData.state}%`)
                        )
                    )
            })
        }

        // Fallback to National if nothing found
        if (!organization) {
            organization = await db.query.organizations.findFirst({
                where: eq(organizations.level, "NATIONAL")
            })
        }

        // Absolute fallback (just in case no National exists)
        if (!organization) {
            organization = await db.query.organizations.findFirst()
        }

        if (!organization) {
            return NextResponse.json(
                { error: "Configuration Error: No organization found to link your membership." },
                { status: 500 }
            )
        }

        const now = new Date()

        await db.insert(members).values({
            userId: userId,
            organizationId: organization.id,
            status: "PENDING",
            membershipType: "REGULAR",
            dateJoined: now,
            isActive: true, // Pending approval effectively
            dateOfBirth: new Date(validData.date_of_birth),
            occupation: validData.occupation,
            emergencyContact: validData.emergencyContactName,
            emergencyPhone: validData.emergencyContactPhone,
            gender: "MALE", // Defaulting as per current logic
            createdAt: now,
            updatedAt: now,
            metadata: {
                fullName: validData.fullName,
                country: validData.country,
                state: validData.state,
                lga: validData.local_government_area,
                branch: validData.branch,
                whatsapp_number: validData.whatsapp_number,
                state_of_origin: validData.state_of_origin,
                lga_of_origin: validData.lga_of_origin,
                qualification: validData.qualification,
                specialization: validData.specialization,
                years_of_experience: validData.years_of_experience,
                membership_duration: validData.membership_duration,
                educationHistory: validData.educationHistory,
                blood_group: validData.blood_group,
                genotype: validData.genotype,
                specific_ailment: validData.specific_ailment,
                hospital: validData.hospital,
                doctorName: validData.doctorName,
                doctorPhone: validData.doctorPhone,
                phone: validData.phone,
                maritalStatus: validData.maritalStatus,
                dateOfMarriage: validData.dateOfMarriage,
                numChildrenMale: validData.numChildrenMale,
                numChildrenFemale: validData.numChildrenFemale
            },
        })

        return NextResponse.json({
            success: true,
            status: "PENDING",
            message: "Application submitted successfully"
        })
    } catch (error: any) {
        console.error("Application submission error details:", {
            message: error.message,
            stack: error.stack,
            cause: error.cause
        })

        let errorMessage = "Failed to submit application. Please check your data and try again."
        if (error instanceof z.ZodError) {
            errorMessage = "Validation error: " + error.errors.map(e => e.message).join(", ")
        } else if (error.message) {
            errorMessage = error.message
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: error instanceof z.ZodError ? 400 : 500 }
        )
    }
}

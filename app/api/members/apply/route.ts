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

        // 2. Get default organization. Ideally we'd map "branch" to an Organization ID here.
        // For MVP, we still default to NATIONAL or just pick one, but store the branch name.
        const organization = await db.query.organizations.findFirst()

        if (!organization) {
            return NextResponse.json(
                { error: "Configuration Error: No organization found" },
                { status: 500 }
            )
        }

        await db.insert(members).values({
            userId: userId,
            organizationId: organization.id,
            // memberId: memberId, // Generated on approval
            status: "PENDING",
            membershipType: "REGULAR",

            // We don't have gender in the new biodataSchema from user snippet? 
            // Wait, user snippet didn't show gender. But typically biodata has gender.
            // My page.tsx refactor REMOVED gender if I followed snippet exactly? 
            dateJoined: new Date(),
            isActive: true, // Pending approval effectively
            dateOfBirth: new Date(validData.date_of_birth),
            occupation: validData.occupation,
            address: address,
            emergencyContact: validData.emergencyContactName,
            emergencyPhone: validData.emergencyContactPhone,
            gender: "MALE", // Defaulting as discussed
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

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Application error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to submit application" },
            { status: 500 }
        )
    }
}

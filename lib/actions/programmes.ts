"use server"

import { db } from "@/lib/db"
import {
    programmes, programmeRegistrations, programmeReports,
    programmeStatusEnum, registrationStatusEnum,
    users, organizations, offices, officials
} from "@/lib/db/schema"
import { getYearPlannerSettings } from "@/lib/actions/settings"
import { eq, desc, and, or, aliasedTable, inArray, sql, asc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getServerSession } from "@/lib/session"
import { members } from "@/lib/db/schema"
import { initializePayment, verifyPayment } from "@/lib/payments"
import { sendEmail, emailTemplates } from "@/lib/email"
import crypto from "crypto"

export async function generateSecurityHash(registrationId: string, email: string) {
    const secret = process.env.SLIP_SECRET || "tmc-secure-slip-2026"
    return crypto.createHmac("sha256", secret)
        .update(`${registrationId}-${email}`)
        .digest("hex")
        .substring(0, 8)
        .toUpperCase()
}

export async function recordAttendance(registrationId: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Authentication required to record attendance" }

    try {
        const [reg] = await db.select({
            registration: programmeRegistrations,
            programme: programmes
        })
        .from(programmeRegistrations)
        .innerJoin(programmes, eq(programmeRegistrations.programmeId, programmes.id))
        .where(eq(programmeRegistrations.id, registrationId))
        .limit(1)

        if (!reg) return { success: false, error: "Registration not found" }

        // Time check: Must be within 3 hours of start date (and before end date if exists)
        const now = new Date()
        const startTime = new Date(reg.programme.startDate)
        const windowHours = reg.programme.attendanceWindow ?? 3
        const allowedStartTime = new Date(startTime.getTime() - (windowHours * 60 * 60 * 1000))
        
        // If programme has an end date, we allow scanning until then. If not, we allow for the day.
        const endTime = reg.programme.endDate ? new Date(reg.programme.endDate) : new Date(startTime.getTime() + (24 * 60 * 60 * 1000))

        if (now < allowedStartTime) {
            return { 
                success: false, 
                error: `Attendance starts ${windowHours} hours before the programme (Starts at ${startTime.toLocaleTimeString()})` 
            }
        }
        
        if (now > endTime) {
             return { success: false, error: "This programme has already concluded." }
        }

        // Must be PAID to check in
        if (reg.registration.status === 'PENDING_PAYMENT') {
            return { success: false, error: "Payment is required before check-in" }
        }

        if (!reg.registration.checkInTime) {
            // First time scanning -> Check In
            await db.update(programmeRegistrations).set({
                checkInTime: now,
                checkInBy: session.user.id,
                status: 'ATTENDED'
            }).where(eq(programmeRegistrations.id, registrationId))

            revalidatePath(`/programmes/verify/${registrationId}`)
            return { success: true, type: 'CHECK_IN', time: now }
        } else {
            // Second time scanning -> Check Out
            await db.update(programmeRegistrations).set({
                checkOutTime: now,
                checkOutBy: session.user.id
            }).where(eq(programmeRegistrations.id, registrationId))

            revalidatePath(`/programmes/verify/${registrationId}`)
            return { success: true, type: 'CHECK_OUT', time: now }
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

import { verifyAttendanceToken, generateAttendanceToken } from "@/lib/attendance-token"

export async function resetAttendance(registrationId: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Authentication required" }

    try {
        await db.update(programmeRegistrations).set({
            checkInTime: null,
            checkOutTime: null,
            checkInBy: null,
            checkOutBy: null,
            status: 'PAID' // Revert to paid status
        }).where(eq(programmeRegistrations.id, registrationId))

        revalidatePath(`/dashboard/admin/programmes`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function selfRecordAttendance(programmeId: string, token: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Please log in to record your attendance" }

    try {
        // 1. Fetch Programme to check for static token
        const [programme] = await db.select().from(programmes).where(eq(programmes.id, programmeId)).limit(1)
        if (!programme) return { success: false, error: "Programme not found" }

        // 2. Verify Token (Check Dynamic then Static)
        let isTokenValid = verifyAttendanceToken(programmeId, token)
        
        if (!isTokenValid && programme.staticAttendanceToken) {
            isTokenValid = token === programme.staticAttendanceToken
        }

        if (!isTokenValid) {
            return { success: false, error: "Invalid or expired QR code. Please scan the current code at the venue." }
        }

        // 3. Find registration
        const [reg] = await db.select().from(programmeRegistrations)
            .where(and(
                eq(programmeRegistrations.programmeId, programmeId),
                eq(programmeRegistrations.userId, session.user.id)
            )).limit(1)

        if (!reg) return { success: false, error: "You are not registered for this programme." }

        // 4. Time check
        const now = new Date()
        const startTime = new Date(programme.startDate)
        const windowHours = programme.attendanceWindow ?? 3
        const allowedStartTime = new Date(startTime.getTime() - (windowHours * 60 * 60 * 1000))
        const endTime = programme.endDate ? new Date(programme.endDate) : new Date(startTime.getTime() + (24 * 60 * 60 * 1000))

        if (now < allowedStartTime) {
            return { success: false, error: "Attendance is not yet open for this programme." }
        }
        if (now > endTime) {
            return { success: false, error: "Attendance for this programme has concluded." }
        }

        // 5. Must be PAID
        if (reg.status === 'PENDING_PAYMENT') {
            return { success: false, error: "Payment is required before check-in." }
        }

        // 6. Toggle Attendance
        if (!reg.checkInTime) {
            await db.update(programmeRegistrations).set({
                checkInTime: now,
                checkInBy: 'SELF_STATIC', // Distinguish static vs dynamic
                status: 'ATTENDED'
            }).where(eq(programmeRegistrations.id, reg.id))
            return { success: true, type: 'CHECK_IN' }
        } else if (!reg.checkOutTime) {
            await db.update(programmeRegistrations).set({
                checkOutTime: now,
                checkOutBy: 'SELF_STATIC'
            }).where(eq(programmeRegistrations.id, reg.id))
            return { success: true, type: 'CHECK_OUT' }
        } else {
            return { success: false, error: "You have already completed your attendance for this programme." }
        }

    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getStaticAttendanceUrl(programmeId: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        let [programme] = await db.select().from(programmes).where(eq(programmes.id, programmeId)).limit(1)
        if (!programme) return { success: false, error: "Programme not found" }

        let token = programme.staticAttendanceToken
        if (!token) {
            // Generate a permanent random token for this programme
            token = crypto.randomBytes(12).toString("hex").toUpperCase()
            await db.update(programmes).set({ staticAttendanceToken: token }).where(eq(programmes.id, programmeId))
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tmcng.net"
        const url = `${appUrl}/programmes/attendance/${programmeId}?token=${token}`

        console.log(`[DEBUG] Generated Static Attendance URL: ${url}`)
        return { success: true, url }
    } catch (error: any) {
        console.error(`[ERROR] getStaticAttendanceUrl failure: ${error.message}`, error)
        return { success: false, error: error.message }
    }
}

export async function getAttendanceTokenAction(programmeId: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }
    
    const token = generateAttendanceToken(programmeId)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tmcng.net"
    const url = `${appUrl}/programmes/attendance/${programmeId}?token=${token}`
    
    return { success: true, token, url }
}

export async function getOffices(organizationId: string) {
    try {
        return await db.select().from(offices).where(eq(offices.organizationId, organizationId))
    } catch (error) {
        return []
    }
}

export async function getOfficials(organizationId: string) {
    try {
        const results = await db.select({
            id: officials.id,
            position: officials.position,
            name: users.name
        })
            .from(officials)
            .innerJoin(users, eq(officials.userId, users.id))
            .where(eq(officials.organizationId, organizationId))
        return results
    } catch (error) {
        return []
    }
}

// Schemas
const ProgrammeSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(10, "Description must be detailed"),
    venue: z.string().min(1, "Venue is required"),
    startDate: z.date(),
    endDate: z.date().optional(),
    time: z.string().optional(),
    targetAudience: z.enum(['PUBLIC', 'MEMBERS', 'BROTHERS', 'SISTERS', 'CHILDREN', 'YOUTH', 'ELDERS']).default('PUBLIC'),
    hasCertificate: z.boolean().default(false),
    paymentRequired: z.boolean().default(false),
    amount: z.number().nonnegative().default(0),
    organizingOfficeId: z.string().optional().nullable(),
    organizingOfficialId: z.string().optional().nullable(),
    // New Planner Fields
    format: z.enum(['PHYSICAL', 'VIRTUAL', 'HYBRID']).default('PHYSICAL'),
    frequency: z.enum(['ONCE', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'BI-ANNUALLY', 'ANNUALLY']).default('ONCE'),
    budget: z.number().nonnegative().default(0),
    objectives: z.string().optional(),
    attendanceWindow: z.string().default("3"),
    certTemplateType: z.enum(['TMC_ONLY', 'PARTNER_ONLY', 'BOTH']).default('TMC_ONLY'),
    certTmcSignature: z.string().optional(),
    certTmcSignatory: z.string().optional(),
    certPartnerName: z.string().optional(),
    certPartnerLogo: z.string().optional(),
    certPartnerSignature: z.string().optional(),
    certPartnerSignatory: z.string().optional(),
})

const ReportSchema = z.object({
    summary: z.string().min(10),
    challenges: z.string().optional(),
    comments: z.string().optional(),
    attendeesMale: z.number().int().nonnegative().default(0),
    attendeesFemale: z.number().int().nonnegative().default(0),
    amountSpent: z.number().nonnegative().default(0),
    images: z.array(z.string().url()).optional(),
})

const RegistrationSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().optional(),
    gender: z.string().optional(),
    address: z.string().optional(),
    country: z.string().optional(),
    state: z.string().optional(),
    lga: z.string().optional(),
})

// --- Programme Management ---

export async function createProgramme(data: z.infer<typeof ProgrammeSchema>, organizationId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        // Fetch creator's organization to determine flow
        const [org] = await db.select().from(organizations).where(eq(organizations.id, organizationId))
        if (!org) return { success: false, error: "Organization not found" }

        // Hierarchical Permission Check
        if (!session.user.isSuperAdmin) {
            const userLevel = session.user.officialLevel as string
            const targetLevel = org.level

            if (userLevel === 'NATIONAL' && targetLevel !== 'NATIONAL') {
                return { success: false, error: "National admins can only create programmes for National level" }
            }
            if (userLevel === 'STATE') {
                if (!['STATE', 'LOCAL_GOVERNMENT', 'BRANCH'].includes(targetLevel)) {
                    return { success: false, error: "State admins can only create for State, LGA, or Branch levels" }
                }
                // Admin must be from the same state
                const userState = (session.user as any).state
                if (userState && org.state && userState !== org.state) {
                    return { success: false, error: `You can only create programmes for your state (${userState})` }
                }
            }
            if (userLevel === 'LOCAL_GOVERNMENT' && targetLevel !== 'LOCAL_GOVERNMENT') {
                return { success: false, error: "LGA admins can only create for LGA level" }
            }
            if (userLevel === 'BRANCH' && targetLevel !== 'BRANCH') {
                return { success: false, error: "Branch admins can only create for Branch level" }
            }
        }

        const validData = ProgrammeSchema.parse(data)

        // Flexible Deadline Check: 
        // Retrieve global year planner settings
        const yearSettings = await getYearPlannerSettings()

        const now = new Date()
        const progDate = new Date(validData.startDate)

        // 1. Validate Programme is within current Programme Year
        if (progDate < yearSettings.programYearStart || progDate > yearSettings.programYearEnd) {
            // Optional: Return error or just warn. User asked for "manageable date range". 
            // Let's return error if it's completely outside the active year to enforce discipline.
            return {
                success: false,
                error: `Programme date must be between ${yearSettings.programYearStart.toDateString()} and ${yearSettings.programYearEnd.toDateString()}`
            }
        }

        let isLateSubmission = false

        // 2. Check Deadline
        // If current date is past the submission deadline, mark as late
        if (now > yearSettings.submissionDeadline) {
            isLateSubmission = true
        }

        let initialStatus: 'DRAFT' | 'PENDING_STATE' | 'PENDING_NATIONAL' | 'APPROVED' = 'DRAFT'

        // Workflow Logic:
        // Branch/LGA -> PENDING_STATE (submitted to State for vetting)
        // State -> PENDING_NATIONAL (submitted to National for vetting/approval)
        // National -> APPROVED

        if (org.level === 'BRANCH' || org.level === 'LOCAL_GOVERNMENT') {
            initialStatus = 'PENDING_STATE'
        } else if (org.level === 'STATE') {
            initialStatus = 'PENDING_NATIONAL'
        } else if (org.level === 'NATIONAL') {
            initialStatus = 'PENDING_NATIONAL'
        }

        const [newProgramme] = await db.insert(programmes).values({
            organizationId,
            level: org.level,
            title: validData.title,
            description: validData.description,
            venue: validData.venue,
            startDate: validData.startDate,
            endDate: validData.endDate,
            time: validData.time,
            targetAudience: validData.targetAudience,
            paymentRequired: validData.paymentRequired,
            amount: validData.amount.toString(),
            hasCertificate: validData.hasCertificate,
            organizingOfficeId: (validData.organizingOfficeId && validData.organizingOfficeId !== "none") ? validData.organizingOfficeId : null,
            organizingOfficialId: (validData.organizingOfficialId && validData.organizingOfficialId !== "none") ? validData.organizingOfficialId : null,
            format: validData.format,
            frequency: validData.frequency,
            budget: validData.budget.toString(),
            objectives: validData.objectives,
            committee: validData.committee,
            isLateSubmission,
            status: initialStatus,
            certTemplateType: validData.certTemplateType,
            certTmcSignature: validData.certTmcSignature,
            certTmcSignatory: validData.certTmcSignatory,
            certPartnerName: validData.certPartnerName,
            certPartnerLogo: validData.certPartnerLogo,
            certPartnerSignature: validData.certPartnerSignature,
            certPartnerSignatory: validData.certPartnerSignatory,
            createdBy: session.user.id,
        }).$returningId()

        revalidatePath("/dashboard/admin/programmes")
        return { success: true, programmeId: newProgramme.id }
    } catch (error) {
        console.error("Create Programme Error:", error)
        return { success: false, error: "Failed to create programme" }
    }
}

export async function approveProgrammeState(programmeId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        // Verify approver is State Level (Middleware usually handles this access, but double check org context if passed)

        await db.update(programmes).set({
            status: 'PENDING_NATIONAL', // Promote to next level
            approvedStateBy: session.user.id,
            approvedStateAt: new Date(),
        }).where(eq(programmes.id, programmeId))

        revalidatePath("/dashboard/admin/programmes")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Approval failed" }
    }
}

export async function approveProgrammeNational(programmeId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        // Prevent self-approval for National programmes
        const [prog] = await db.select().from(programmes).where(eq(programmes.id, programmeId)).limit(1)
        if (prog && prog.createdBy === session.user.id && !session.user.isSuperAdmin) {
            return { success: false, error: "Self-approval is not allowed. Must be approved by another admin or assigned officer." }
        }

        await db.update(programmes).set({
            status: 'APPROVED',
            approvedNationalBy: session.user.id,
            approvedNationalAt: new Date(),
        }).where(eq(programmes.id, programmeId))

        revalidatePath("/dashboard/admin/programmes")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Approval failed" }
    }
}

export async function rejectProgramme(programmeId: string, reason: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        await db.update(programmes).set({
            status: 'REJECTED',
            rejectionReason: reason,
            updatedAt: new Date(),
        }).where(eq(programmes.id, programmeId))

        revalidatePath("/dashboard/admin/programmes")
        return { success: true }
    } catch (error) {
        console.error("Reject Programme Error:", error)
        return { success: false, error: "Rejection failed" }
    }
}

// Public/Listing Filter
export async function getProgrammes(filters?: { level?: string, state?: string, status?: string }) {
    // Explicit joins for compatibility query
    const org = aliasedTable(organizations, "org")

    let conditions = [eq(programmes.status, 'APPROVED')] // Default only approved for public

    if (filters?.level) {
        conditions.push(eq(programmes.level as any, filters.level))
    }
    if (filters?.state) {
        conditions.push(eq(org.state, filters.state))
    }
    if (filters?.status) {
        // If admin viewing, might not just be approved
        conditions = [eq(programmes.status as any, filters.status)]
    }

    const results = await db.select({
        programme: programmes,
        organization: org
    })
        .from(programmes)
        .leftJoin(org, eq(programmes.organizationId, org.id))
        .where(and(...conditions))
        .orderBy(desc(programmes.startDate))

    return results.map(r => ({ ...r.programme, organization: r.organization }))
}

// For Admin Dashboard (My Programmes + Approvals)
export async function getAdminProgrammes(organizationId: string, type: 'MY_PROGRAMMES' | 'TO_APPROVE') {
    const creator = aliasedTable(users, "creator")
    const org = aliasedTable(organizations, "org")
    const office = aliasedTable(offices, "office")
    const official = aliasedTable(officials, "official")
    const officialUser = aliasedTable(users, "officialUser")

    if (type === 'MY_PROGRAMMES') {
        const results = await db.select({
            programme: programmes,
            creator: creator,
            office: office,
            official: official,
            officialUser: officialUser
        })
            .from(programmes)
            .leftJoin(creator, eq(programmes.createdBy, creator.id))
            .leftJoin(office, eq(programmes.organizingOfficeId, office.id))
            .leftJoin(official, eq(programmes.organizingOfficialId, official.id))
            .leftJoin(officialUser, eq(official.userId, officialUser.id))
            .where(eq(programmes.organizationId, organizationId))
            .orderBy(desc(programmes.createdAt))

        return results.map(r => ({ 
            ...r.programme, 
            creator: r.creator, 
            office: r.office,
            official: r.official ? { ...r.official, user: r.officialUser } : null
        }))
    }

    if (type === 'TO_APPROVE') {
        const session = await getServerSession()
        const isSuperAdmin = session?.user?.isSuperAdmin

        let myOrg = null
        if (organizationId) {
            const orgResults = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1)
            myOrg = orgResults[0]
        }

        if (!myOrg && !isSuperAdmin) return []

        let condition: any = sql`1=0`

        if (isSuperAdmin) {
            // SuperAdmins see all pending programmes (State and National level)
            condition = or(
                eq(programmes.status, 'PENDING_STATE'),
                eq(programmes.status, 'PENDING_NATIONAL')
            )
        } else if (myOrg && myOrg.level === 'STATE') {
            condition = and(
                eq(programmes.status, 'PENDING_STATE'),
                or(
                    eq(programmes.organizationId, organizationId),
                    eq(org.parentId, organizationId),
                    sql`${org.parentId} IN (SELECT id FROM organizations WHERE parentId = ${organizationId} OR id = ${organizationId})`
                )
            )
        } else if (myOrg && myOrg.level === 'NATIONAL') {
            condition = eq(programmes.status, 'PENDING_NATIONAL')
        }

        const results = await db.select({
            programme: programmes,
            creator: creator,
            org: org,
            office: office,
            official: official,
            officialUser: officialUser
        })
            .from(programmes)
            .leftJoin(creator, eq(programmes.createdBy, creator.id))
            .leftJoin(org, eq(programmes.organizationId, org.id))
            .leftJoin(office, eq(programmes.organizingOfficeId, office.id))
            .leftJoin(official, eq(programmes.organizingOfficialId, official.id))
            .leftJoin(officialUser, eq(official.userId, officialUser.id))
            .where(condition)
            .orderBy(desc(programmes.createdAt))

        return results.map(r => ({ 
            ...r.programme, 
            creator: r.creator, 
            organization: r.org, 
            office: r.office,
            official: r.official ? { ...r.official, user: r.officialUser } : null
        }))
    }
}

// --- Registration ---

export async function registerForProgramme(programmeId: string, data?: z.infer<typeof RegistrationSchema>) {
    const session = await getServerSession()
    
    try {
        const [programme] = await db.select().from(programmes).where(eq(programmes.id, programmeId)).limit(1)
        if (!programme) return { success: false, error: "Programme not found" }

        // Check for existing registration
        let existingReg: { id: string, status: string | null, email: string } | null = null;
        const normalizedEmail = data?.email?.trim().toLowerCase() || session?.user?.email?.trim().toLowerCase();
        
        if (session?.user) {
            const results = await db.select({ id: programmeRegistrations.id, status: programmeRegistrations.status, email: programmeRegistrations.email }).from(programmeRegistrations)
                .where(and(
                    eq(programmeRegistrations.programmeId, programmeId),
                    eq(programmeRegistrations.userId, session.user.id)
                )).limit(1)
            if (results.length > 0) existingReg = results[0]
        } 
        
        // Secondary check by email if not found by userId or if guest
        if (!existingReg && normalizedEmail) {
            const results = await db.select({ id: programmeRegistrations.id, status: programmeRegistrations.status, email: programmeRegistrations.email }).from(programmeRegistrations)
                .where(and(
                    eq(programmeRegistrations.programmeId, programmeId),
                    eq(programmeRegistrations.email, normalizedEmail)
                )).limit(1)
            if (results.length > 0) existingReg = results[0]
        }

        if (existingReg) {
            // If already paid or attended, they are done.
            if (existingReg.status === 'PAID' || existingReg.status === 'ATTENDED') {
                return { 
                    success: false, 
                    error: "You have already registered and paid for this programme.",
                    registrationId: existingReg.id
                }
            }
            
            // If it's a paid programme and they haven't paid yet
            if (programme.paymentRequired && parseFloat(programme.amount || "0") > 0) {
                 return { 
                    success: true, 
                    registrationId: existingReg.id, 
                    paymentRequired: true,
                    amount: programme.amount,
                    isResume: true
                }
            }

            // Otherwise (free programme and already registered)
            return { 
                success: false, 
                error: "You have already registered for this programme.",
                registrationId: existingReg.id
            }
        }

        let registrationData: any = {
            programmeId,
            status: programme.paymentRequired && parseFloat(programme.amount || "0") > 0 ? 'PENDING_PAYMENT' : 'REGISTERED',
        }

        if (session?.user) {
            // Logged in user (Member or Official)
            const [memberData] = await db.select({
                id: members.id,
                gender: members.gender,
                address: members.address,
                orgName: organizations.name,
                orgState: organizations.state,
                orgCity: organizations.city,
                userPhone: users.phone,
                userCountry: users.country
            })
            .from(members)
            .innerJoin(users, eq(members.userId, users.id))
            .innerJoin(organizations, eq(members.organizationId, organizations.id))
            .where(eq(members.userId, session.user.id))
            .limit(1)
            
            registrationData = {
                ...registrationData,
                userId: session.user.id,
                memberId: memberData?.id || null,
                name: session.user.name || "Unknown",
                email: session.user.email || "Unknown",
                phone: memberData?.userPhone || session.user.phone || null,
                gender: (memberData?.gender as any) || 'MALE',
                address: memberData?.address || null,
                country: memberData?.userCountry || "Nigeria",
                state: memberData?.orgState || null,
                lga: memberData?.orgCity || null,
                branch: memberData?.orgName || null
            }
        } else if (data) {
            // Guest registration
            const validData = RegistrationSchema.parse(data)
            registrationData = {
                ...registrationData,
                name: validData.name,
                email: validData.email,
                phone: validData.phone,
                gender: validData.gender,
                address: validData.address,
                country: validData.country || "Nigeria",
                state: validData.state,
                lga: validData.lga,
                branch: null // Guests don't have branches
            }
        } else {
            return { success: false, error: "Registration data required for guests" }
        }

        const [newReg] = await db.insert(programmeRegistrations).values(registrationData).$returningId()
        
        if (registrationData.status === 'REGISTERED') {
            // Fetch member info for ID if exists
            const [member] = registrationData.memberId 
                ? await db.select().from(members).where(eq(members.id, registrationData.memberId)).limit(1)
                : [null]

            await sendEmail({
                to: registrationData.email,
                ...emailTemplates.programmeRegistrationReceipt(
                    registrationData.name,
                    programme.title,
                    0,
                    newReg.id,
                    member?.memberId || undefined
                )
            })
        }

        return { 
            success: true, 
            registrationId: newReg.id, 
            paymentRequired: registrationData.status === 'PENDING_PAYMENT',
            amount: programme.amount
        }
    } catch (e) {
        console.error("Registration Error:", e)
        return { success: false, error: "Registration failed" }
    }
}

export async function getProgrammeRegistrations(programmeId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return []

        const checkInGatekeeper = aliasedTable(users, "checkInGatekeeper")
        const checkOutGatekeeper = aliasedTable(users, "checkOutGatekeeper")

        const results = await db.select({
            registration: programmeRegistrations,
            user: users,
            member: members,
            checkInBy: checkInGatekeeper.name,
            checkOutBy: checkOutGatekeeper.name,
        })
            .from(programmeRegistrations)
            .leftJoin(users, eq(programmeRegistrations.userId, users.id))
            .leftJoin(members, eq(programmeRegistrations.memberId, members.id))
            .leftJoin(checkInGatekeeper, eq(programmeRegistrations.checkInBy, checkInGatekeeper.id))
            .leftJoin(checkOutGatekeeper, eq(programmeRegistrations.checkOutBy, checkOutGatekeeper.id))
            .where(eq(programmeRegistrations.programmeId, programmeId))
            .orderBy(desc(programmeRegistrations.registeredAt))

        return results.map(r => ({
            ...r.registration,
            user: r.user,
            member: r.member,
            checkInBy: r.checkInBy || r.registration.checkInBy,
            checkOutBy: r.checkOutBy || r.registration.checkOutBy
        }))
    } catch (error) {
        console.error("Fetch Registrations Error:", error)
        return []
    }
}

export async function getRegistrationDetails(registrationId: string) {
    try {
        const [result] = await db.select({
            registration: programmeRegistrations,
            programme: programmes,
            member: members,
            organization: organizations,
            user: users,
        })
            .from(programmeRegistrations)
            .innerJoin(programmes, eq(programmeRegistrations.programmeId, programmes.id))
            .leftJoin(members, eq(programmeRegistrations.memberId, members.id))
            .leftJoin(organizations, eq(programmes.organizationId, organizations.id))
            .leftJoin(users, eq(programmeRegistrations.userId, users.id))
            .where(eq(programmeRegistrations.id, registrationId))
            .limit(1)

        if (!result) return null

        const securityHash = await generateSecurityHash(result.registration.id, result.registration.email)

        return {
            ...result.registration,
            programme: result.programme,
            member: result.member,
            organization: result.organization,
            user: result.user,
            securityHash
        }
    } catch (error) {
        console.error("Fetch Registration Details Error:", error)
        return null
    }
}

export async function initializeProgrammeRegistrationPayment(registrationId: string) {
    try {
        const registration = await getRegistrationDetails(registrationId)
        if (!registration) return { success: false, error: "Registration not found" }
        
        const amount = parseFloat(registration.programme.amount || "0")
        if (amount <= 0) return { success: false, error: "No payment required" }

        const response = await initializePayment({
            email: registration.email,
            amount: amount,
            callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/programmes/registrations/${registrationId}/verify`,
            metadata: {
                registrationId: registrationId,
                type: "PROGRAMME_REGISTRATION",
                programmeId: registration.programmeId
            }
        })

        if (response.success) {
            await db.update(programmeRegistrations)
                .set({ paymentReference: response.reference })
                .where(eq(programmeRegistrations.id, registrationId))
            
            return response
        }
        
        return { success: false, error: response.error }
    } catch (error) {
        console.error("Payment Init Error:", error)
        return { success: false, error: "Payment initialization failed" }
    }
}

export async function verifyProgrammeRegistrationPayment(registrationId: string, reference: string) {
    try {
        const response = await verifyPayment(reference)
        if (response.success && response.data?.status === "success") {
            await db.update(programmeRegistrations)
                .set({ 
                    status: 'PAID',
                    amountPaid: response.data?.amount?.toString() || "0",
                    paymentReference: reference
                })
                .where(eq(programmeRegistrations.id, registrationId))
            
            revalidatePath(`/programmes/registrations/${registrationId}/slip`)

            // Send confirmation email
            const regDetails = await getRegistrationDetails(registrationId)
            if (regDetails) {
                await sendEmail({
                    to: regDetails.email,
                    ...emailTemplates.programmeRegistrationReceipt(
                        regDetails.name,
                        regDetails.programme.title,
                        parseFloat(regDetails.amountPaid || "0"),
                        registrationId,
                        regDetails.member?.memberId || undefined
                    )
                })
            }
            
            return { success: true }
        }
        return { success: false, error: response.data?.status || response.error || "Payment verification failed" }
    } catch (error) {
        console.error("Payment Verify Error:", error)
        return { success: false, error: "Verification failed" }
    }
}

// --- Reporting ---

export async function submitProgrammeReport(programmeId: string, data: z.infer<typeof ReportSchema>) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const validData = ReportSchema.parse(data)

        await db.insert(programmeReports).values({
            programmeId,
            summary: validData.summary,
            challenges: validData.challenges,
            comments: validData.comments,
            attendeesMale: validData.attendeesMale,
            attendeesFemale: validData.attendeesFemale,
            amountSpent: validData.amountSpent.toString(),
            images: validData.images || null,
            submittedBy: session.user.id,
        })

        await db.update(programmes).set({ status: 'COMPLETED' }).where(eq(programmes.id, programmeId))

        revalidatePath("/dashboard/admin/programmes")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Report submission failed" }
    }
}

// --- Attendance & Certificates ---

export async function markAttendance(registrationId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        await db.update(programmeRegistrations).set({
            status: 'ATTENDED'
        }).where(eq(programmeRegistrations.id, registrationId))

        revalidatePath("/dashboard/admin/programmes")
        return { success: true }
    } catch (e) {
        return { success: false, error: "Failed to mark attendance" }
    }
}

export async function getUserRegistrations() {
    const session = await getServerSession()
    if (!session?.user?.id) return []

    const results = await db.select({
        registration: programmeRegistrations,
        programme: programmes
    })
        .from(programmeRegistrations)
        .leftJoin(programmes, eq(programmeRegistrations.programmeId, programmes.id))
        .where(eq(programmeRegistrations.userId, session.user.id))
        .orderBy(desc(programmes.startDate))

    return results.map(r => ({
        ...r.registration,
        programme: r.programme
    }))
}

export async function deleteProgramme(programmeId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        // Optional: Check permissions (e.g. only Admin or Creator)

        await db.delete(programmes).where(eq(programmes.id, programmeId))

        revalidatePath("/dashboard/admin/programmes")
        return { success: true }
    } catch (error) {
        console.error("Delete Programme Error:", error)
        return { success: false, error: "Failed to delete programme" }
    }
}

export async function updateProgramme(programmeId: string, data: Partial<z.infer<typeof ProgrammeSchema>>) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const validData = ProgrammeSchema.partial().parse(data)

        const [current] = await db.select().from(programmes).where(eq(programmes.id, programmeId))
        if (!current) return { success: false, error: "Programme not found" }

        // Determine if this is a re-submission
        let newStatus = current.status
        let rejectionReason = current.rejectionReason

        if (current.status === 'REJECTED') {
            // Fetch organization level to determine re-submission status
            const [org] = await db.select().from(organizations).where(eq(organizations.id, current.organizationId))
            if (org) {
                if (org.level === 'BRANCH' || org.level === 'LOCAL_GOVERNMENT') {
                    newStatus = 'PENDING_STATE'
                } else if (org.level === 'STATE') {
                    newStatus = 'PENDING_NATIONAL'
                } else if (org.level === 'NATIONAL') {
                    newStatus = 'APPROVED'
                }
            }
            rejectionReason = null // Clear reason on re-submission
        }

        await db.update(programmes).set({
            title: validData.title,
            description: validData.description,
            venue: validData.venue,
            startDate: validData.startDate,
            endDate: validData.endDate,
            time: validData.time,
            targetAudience: validData.targetAudience,
            paymentRequired: validData.paymentRequired,
            amount: validData.amount !== undefined ? validData.amount.toString() : undefined,
            organizingOfficeId: validData.organizingOfficeId,
            organizingOfficialId: validData.organizingOfficialId,
            format: validData.format,
            frequency: validData.frequency,
            budget: validData.budget !== undefined ? validData.budget.toString() : undefined,
            objectives: validData.objectives,
            committee: validData.committee,
            status: newStatus,
            rejectionReason,
            hasCertificate: validData.hasCertificate,
            certTemplateType: validData.certTemplateType,
            certTmcSignature: validData.certTmcSignature,
            certTmcSignatory: validData.certTmcSignatory,
            certPartnerName: validData.certPartnerName,
            certPartnerLogo: validData.certPartnerLogo,
            certPartnerSignature: validData.certPartnerSignature,
            certPartnerSignatory: validData.certPartnerSignatory,
            updatedAt: new Date()
        }).where(eq(programmes.id, programmeId))

        revalidatePath("/dashboard/admin/programmes")
        return { success: true }
    } catch (error) {
        console.error("Update Programme Error:", error)
        return { success: false, error: "Failed to update programme" }
    }
}

export async function deleteProgrammeRegistration(registrationId: string) {
    try {
        await db.delete(programmeRegistrations).where(eq(programmeRegistrations.id, registrationId))
        revalidatePath(`/dashboard/admin/programmes`)
        return { success: true }
    } catch (error) {
        console.error("Delete Registration Error:", error)
        return { success: false, error: "Failed to delete registration" }
    }
}

export async function deleteAllProgrammeRegistrations(programmeId: string) {
    try {
        await db.delete(programmeRegistrations).where(eq(programmeRegistrations.programmeId, programmeId))
        revalidatePath(`/dashboard/admin/programmes`)
        return { success: true }
    } catch (error) {
        console.error("Delete All Registrations Error:", error)
        return { success: false, error: "Failed to delete all registrations" }
    }
}

export async function syncAllProgrammePayments(programmeId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        // Fetch all pending registrations with a reference
        const pending = await db.select()
            .from(programmeRegistrations)
            .where(and(
                eq(programmeRegistrations.programmeId, programmeId),
                eq(programmeRegistrations.status, 'PENDING_PAYMENT'),
                sql`${programmeRegistrations.paymentReference} IS NOT NULL`
            ))

        if (pending.length === 0) return { success: true, count: 0, message: "No pending payments to sync" }

        let successCount = 0
        for (const reg of pending) {
            if (!reg.paymentReference) continue

            const verification = await verifyPayment(reg.paymentReference)
            if (verification.success && verification.data?.status === "success") {
                await db.update(programmeRegistrations)
                    .set({ 
                        status: 'PAID',
                        amountPaid: verification.data?.amount?.toString() || "0"
                    })
                    .where(eq(programmeRegistrations.id, reg.id))
                
                successCount++
            }
        }

        revalidatePath(`/dashboard/admin/programmes/${programmeId}/registrations`)
        return { 
            success: true, 
            count: successCount, 
            message: `Successfully synced ${successCount} out of ${pending.length} pending payments.` 
        }
    } catch (error) {
        console.error("Sync Payments Error:", error)
        return { success: false, error: "Failed to sync payments" }
    }
}

export async function sendCertificatesAction(programmeId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        // Fetch programme details
        const [programme] = await db.select()
            .from(programmes)
            .where(eq(programmes.id, programmeId))
            .limit(1)

        if (!programme) return { success: false, error: "Programme not found" }

        // Fetch all attended participants who haven't been sent certificates yet (optional)
        // For simplicity, we'll send to all 'ATTENDED' participants
        const participants = await db.select()
            .from(programmeRegistrations)
            .where(and(
                eq(programmeRegistrations.programmeId, programmeId),
                eq(programmeRegistrations.status, 'ATTENDED')
            ))

        if (participants.length === 0) {
            return { success: false, error: "No attended participants found to send certificates to." }
        }

        let sentCount = 0
        for (const part of participants) {
            if (!part.email) continue

            const emailContent = emailTemplates.programmeCertificateThankYou(
                part.name,
                programme.title,
                part.id
            )

            await sendEmail({
                to: part.email,
                ...emailContent
            })
            sentCount++
        }

        return { 
            success: true, 
            message: `Successfully queued/sent certificates to ${sentCount} participants.` 
        }
    } catch (error) {
        console.error("Send Certificates Error:", error)
        return { success: false, error: "Failed to send certificates" }
    }
}

import { programmeMessages } from "@/lib/db/schema"

export async function sendProgrammeMessage(programmeId: string, content: string, isAnnouncement: boolean = false) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const isAdmin = session.user.isSuperAdmin || 
                        session.user.roles?.some((r: any) => r.code === 'ADMIN' || r.jurisdictionLevel !== 'MEMBER') ||
                        !!session.user.officialId

        // Verify registration if not announcement and not admin
        if (!isAnnouncement && !isAdmin) {
            const [reg] = await db.select().from(programmeRegistrations)
                .where(and(
                    eq(programmeRegistrations.programmeId, programmeId),
                    eq(programmeRegistrations.userId, session.user.id)
                )).limit(1)
            
            if (!reg) return { success: false, error: "You must be registered to participate in the group" }
        }

        // Only admins can send announcements
        if (isAnnouncement && !isAdmin) {
            return { success: false, error: "Only administrators can post announcements" }
        }

        await db.insert(programmeMessages).values({
            programmeId,
            userId: session.user.id,
            content,
            isAnnouncement
        })

        revalidatePath(`/dashboard/programmes/${programmeId}/group`)
        return { success: true }
    } catch (error) {
        console.error("Send Message Error:", error)
        return { success: false, error: "Failed to send message" }
    }
}

export async function getProgrammeMessages(programmeId: string) {
    try {
        const results = await db.select({
            id: programmeMessages.id,
            content: programmeMessages.content,
            createdAt: programmeMessages.createdAt,
            isAnnouncement: programmeMessages.isAnnouncement,
            user: {
                name: users.name,
                image: users.image
            }
        })
        .from(programmeMessages)
        .innerJoin(users, eq(programmeMessages.userId, users.id))
        .where(eq(programmeMessages.programmeId, programmeId))
        .orderBy(asc(programmeMessages.createdAt))

        return results
    } catch (error) {
        console.error("Get Messages Error:", error)
        return []
    }
}

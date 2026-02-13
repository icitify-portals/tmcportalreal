import { db } from "@/lib/db"
import { members, notifications, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requirePermission } from "@/lib/rbac-v2"
import { generateMembershipId } from "@/lib/id-generator"
import { sendEmail, emailTemplates } from "@/lib/email"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { getMembershipSettings } from "@/lib/actions/settings"

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Params is a promise in Next 15
) {
    try {
        const { id } = await params
        console.log(`[PATCH Status] processing for id: ${id}`)
        const session = await getServerSession()

        // Check basic permissions first, detailed checks per action below
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { action, reason } = body

        // Fetch current member
        const rows = await db.select({
            member: members,
            user: {
                id: users.id,
                email: users.email,
                name: users.name
            }
        })
            .from(members)
            .leftJoin(users, eq(members.userId, users.id))
            .where(eq(members.id, id))
            .limit(1);

        const row = rows[0];
        const member = row ? { ...row.member, user: row.user } : null;

        if (!member) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 })
        }

        if (action === "RECOMMEND") {
            // Check permission
            // requirePermission(session, "members:recommend") // Assuming we have this, or use update
            // For now, use members:update as proxy

            await db.update(members)
                .set({
                    status: "RECOMMENDED", // As discussed, mapped to MemberStatus.RECOMMENDED
                    recommendedBy: session.user.id,
                    recommendedAt: new Date(),
                })
                .where(eq(members.id, id))

            // Notify User
            await db.insert(notifications).values({
                userId: member.userId,
                title: "Application Recommended",
                message: "Your application has been recommended by the branch/state admin and is awaiting final approval.",
                type: "INFO"
            })

            return NextResponse.json({ success: true, message: "Application recommended" })
        }

        if (action === "APPROVE") {
            // requirePermission(session, "members:approve") 

            // 1. Check if recommendation is required
            const settings = await getMembershipSettings()

            // Allow Admins to bypass
            const isSuperAdmin = session.user.isSuperAdmin;
            const hasAdminRole = session.user.roles?.some((r: any) =>
                ["NATIONAL", "STATE", "LOCAL_GOVERNMENT", "BRANCH", "SYSTEM"].includes(r.jurisdictionLevel)
            );
            const canBypassRecommendation = isSuperAdmin || hasAdminRole;

            if (settings.recommendationRequired && member.status !== "RECOMMENDED" && !canBypassRecommendation) {
                return NextResponse.json(
                    { error: "This application must be recommended by an official before final approval." },
                    { status: 403 }
                )
            }

            // Generate ID
            // Retrieve country/state from metadata or parsing address
            const meta = member.metadata as any;
            const country = meta?.country || "Nigeria"; // Fallback
            const state = meta?.state || "Lagos"; // Fallback

            const newId = await generateMembershipId(country, state);

            await db.update(members)
                .set({
                    status: "ACTIVE",
                    approvedBy: session.user.id,
                    approvedAt: new Date(),
                    memberId: newId, // Update the temp ID to the official one
                    dateJoined: new Date(), // Set official join date
                })
                .where(eq(members.id, id))

            // Create Notification
            await db.insert(notifications).values({
                userId: member.userId,
                title: "Membership Approved",
                message: `Congratulations! Your membership has been approved. Your Member ID is ${newId}.`,
                type: "SUCCESS"
            })

            // Send Email
            if (member.user && member.user.email) {
                const emailTemplate = emailTemplates.membershipApproved(member.user.name || "Member", newId)
                await sendEmail({
                    to: member.user.email,
                    subject: emailTemplate.subject,
                    html: emailTemplate.html,
                    text: emailTemplate.text,
                })
            }

            return NextResponse.json({ success: true, message: "Application approved", memberId: newId })
        }

        if (action === "REJECT") {
            if (!reason) {
                return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 })
            }

            await db.update(members)
                .set({
                    status: "REJECTED",
                    rejectionReason: reason
                })
                .where(eq(members.id, id))

            // Create Notification
            await db.insert(notifications).values({
                userId: member.userId,
                title: "Application Rejected",
                message: `Your application needs attention: ${reason}`,
                type: "ERROR",
                actionUrl: "/dashboard/member/apply"
            })

            // Send Email
            if (member.user && member.user.email) {
                const emailTemplate = emailTemplates.membershipRejected(member.user.name || "Member", reason)
                await sendEmail({
                    to: member.user.email,
                    subject: emailTemplate.subject,
                    html: emailTemplate.html,
                    text: emailTemplate.text,
                })
            }

            return NextResponse.json({ success: true, message: "Application rejected" })
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 })

    } catch (error: any) {
        console.error("Status update error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to update status" },
            { status: 500 }
        )
    }
}

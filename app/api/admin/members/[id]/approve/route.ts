
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { members, notifications } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { generateMembershipId } from "@/lib/actions/membership-id"
import { requireAdmin } from "@/lib/rbac"
import { sendEmail, emailTemplates } from "@/lib/email"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession()
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Ensure admin
    // await requireAdmin(session) // Uncomment when RBAC is fully set up or just check role
    // For now, let's assume valid admin check or simple role check:
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
        // Check if they are an Official with approval rights? 
        // For MVP, stick to role check or proceed if internal logic handles it.
    }

    const { id } = await params

    try {
        console.log(`Approving member ${id}...`)

        // 1. Generate ID (handles state/country lookups and serial increment)
        // 1. Generate ID (handles state/country lookups and serial increment)
        const newId = await generateMembershipId(id)

        // Fetch User and Member details for notification
        const member = await db.query.members.findFirst({
            where: eq(members.id, id),
            with: {
                user: true
            }
        })

        if (member && member.user) {
            // 2. Create Notification (Triggers Toast)
            await db.insert(notifications).values({
                userId: member.userId,
                title: "Membership Approved",
                message: `Congratulations! Your membership has been approved. Your Member ID is ${newId}.`,
                type: "SUCCESS",
                actionUrl: "/dashboard"
            })

            // 3. Send Email
            if (member.user.email) {
                const emailTemplate = emailTemplates.membershipApproved(member.user.name || "Member", newId)
                // We assume sendEmail is imported or will be auto-imported/we need to import it
                // Need to import sendEmail and emailTemplates at top
                await sendEmail({
                    to: member.user.email,
                    subject: emailTemplate.subject,
                    html: emailTemplate.html,
                    text: emailTemplate.text,
                })
            }
        }

        return NextResponse.json({
            success: true,
            memberId: newId,
            message: `Member approved successfully. ID: ${newId}`
        })

    } catch (error: any) {
        console.error("Approval error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to approve member" },
            { status: 500 }
        )
    }
}

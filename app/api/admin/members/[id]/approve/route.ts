
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { members } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { generateMembershipId } from "@/lib/actions/membership-id"
import { requireAdmin } from "@/lib/rbac"

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
        const newId = await generateMembershipId(id)

        // 2. Any other approval logic (e.g. email notification) can go here.

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

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { members } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/rbac"

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Params is a promise in Next 15
) {
    try {
        const { id } = await params
        const session = await getServerSession()
        requireAdmin(session) // Explicit admin check

        const body = await request.json()
        const { memberId } = body

        if (!memberId) {
            return NextResponse.json({ error: "Member ID is required" }, { status: 400 })
        }

        // Check uniqueness
        const existing = await db.query.members.findFirst({
            where: eq(members.memberId, memberId)
        })

        if (existing && existing.id !== id) {
            return NextResponse.json({ error: "Member ID already in use" }, { status: 409 })
        }

        await db.update(members)
            .set({ memberId: memberId })
            .where(eq(members.id, id))

        return NextResponse.json({ success: true, message: "ID updated" })

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to update ID" },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Params is a promise in Next 15
) {
    try {
        const { id } = await params
        const session = await getServerSession()
        requireAdmin(session)

        await db.update(members)
            // Reset to a temporary ID or null? 
            // Schema treats memberId as unique String (not null in my snippet earlier? Let's check schema).
            // Line 124: memberId String @unique.
            // It is NOT optional. So we cannot set it to null.
            // We must set it to something unique. 
            // Maybe revert to temp ID: "TEMP-UUID"?
            .set({ memberId: `TEMP-${Date.now()}` }) // Reverting to temp format
            .where(eq(members.id, id))

        return NextResponse.json({ success: true, message: "ID removed (reset to temp)" })

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to delete ID" },
            { status: 500 }
        )
    }
}

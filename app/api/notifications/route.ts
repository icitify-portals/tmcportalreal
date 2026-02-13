import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { eq, desc, and } from "drizzle-orm"

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession()
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userNotifications = await db.query.notifications.findMany({
            where: eq(notifications.userId, session.user.id),
            orderBy: [desc(notifications.createdAt)],
            limit: 20
        })

        const unreadCount = userNotifications.filter(n => !n.isRead).length // Basic count from fetched

        // Or proper count query if performance needed later

        return NextResponse.json({
            notifications: userNotifications,
            unreadCount
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession()
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { notificationId, markAllRead } = body

        if (markAllRead) {
            await db.update(notifications)
                .set({ isRead: true })
                .where(and(
                    eq(notifications.userId, session.user.id),
                    eq(notifications.isRead, false)
                ))
            return NextResponse.json({ success: true, message: "All marked as read" })
        }

        if (notificationId) {
            await db.update(notifications)
                .set({ isRead: true })
                .where(and(
                    eq(notifications.id, notificationId),
                    eq(notifications.userId, session.user.id)
                ))
            return NextResponse.json({ success: true, message: "Marked as read" })
        }

        return NextResponse.json({ error: "Invalid request" }, { status: 400 })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

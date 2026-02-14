"use server"

import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { getServerSession } from "@/lib/session"

export async function getUnreadNotifications() {
    const session = await getServerSession()
    if (!session?.user?.id) return []

    try {
        const data = await db.select()
            .from(notifications)
            .where(
                and(
                    eq(notifications.userId, session.user.id),
                    eq(notifications.isRead, false)
                )
            )
            .orderBy(desc(notifications.createdAt))
            .limit(5) // Don't overwhelm with too many toasts at once

        return data
    } catch (error) {
        console.error("Failed to fetch notifications:", error)
        return []
    }
}

export async function markNotificationAsRead(id: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false }

    try {
        await db.update(notifications)
            .set({ isRead: true })
            .where(
                and(
                    eq(notifications.id, id),
                    eq(notifications.userId, session.user.id)
                )
            )
        return { success: true }
    } catch (error) {
        console.error("Failed to mark notification as read:", error)
        return { success: false }
    }
}

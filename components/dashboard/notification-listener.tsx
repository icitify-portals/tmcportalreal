"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { getUnreadNotifications, markNotificationAsRead } from "@/lib/actions/notifications"
import { useSession } from "next-auth/react"

export function NotificationListener() {
    const { data: session } = useSession()
    const hasFetched = useRef(false)

    useEffect(() => {
        if (!session?.user || hasFetched.current) return

        const fetchNotifications = async () => {
            hasFetched.current = true // Prevent double fetch in Strict Mode
            const unread = await getUnreadNotifications()

            if (unread && unread.length > 0) {
                unread.forEach(notification => {
                    // Show toast
                    toast(notification.title, {
                        description: notification.message,
                        action: notification.actionUrl ? {
                            label: "View",
                            onClick: () => window.location.href = notification.actionUrl!
                        } : undefined,
                        duration: 5000,
                    })

                    // Mark as read immediately so it doesn't show again on refresh
                    markNotificationAsRead(notification.id)
                })
            }
        }

        fetchNotifications()
    }, [session])

    return null // This component doesn't render anything visible
}
